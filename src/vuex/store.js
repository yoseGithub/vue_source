import store from '../store'
import { applyMixin } from './mixin'
import ModuleCollection from './module/module-collection'
import { forEachValue } from './util'
export let Vue // 此 Vue 是用户注册插件时传入的 Vue 构造函数

// 最开始定义的时候，用的是用户传入的 state，但是一旦执行了replaceState，则 $$state 被替换
// Vue.set(parent, path[path.length - 1], module.state) 用的是最初传入定义成响应式的state（也就是rootState）,而replaceState设置的是store的state
// 一个是 module的state，一个是变更的store的state，就会导致commit时数据取值不正确（一直是旧数据），所以需要去store上重新获取
const getState = (store, path) => { // store.state获取的是最新状态
    return path.reduce((rootState, current) => {
        return rootState[current]
    }, store.state)
}

/**
 * @param {Object} store store实例
 * @param {Array} path 模块父子关系，初始为空
 * @param {Object} module 用户配置转化为树结构后的模块
 * @param {*} rootState 全局store的state
 * @descript 将模块中的mutations和actions都合并到全局上，通过栈的方式依次push，调用的时候依次执行
 * 将模块中的 state 和 getters 也合并到全局上，state会将模块名设置为全局的键，而getters则是没用namespace的话会合并到全局，后面同名的会覆盖前面的
 */
const installMudole = (store, path, module, rootState) => {
    const namespace = store._modules.getNamespace(path)

    // store => [], store.modules => ['a'], store.modules.modules => ['a', 'c']
    if (path.length > 0) { // 是子模块
        const parent = path.slice(0, -1).reduce((memo, current) => {
            return memo[current]
        }, rootState)

        // vue-router是使用Vue.util.defineReactive，所以这里写成Vue.util.defineReactive(parent, path[path.length - 1], module.state)也可以
        // 因为目标就是要把模块定义成响应式的，源码路径：/src/core/util
        // 这里不用set也能实现响应式，因为下面会把 state 设置到创建的 Vue 上来实现响应式，不过源码中就是用的set
        store._withCommiting(() => Vue.set(parent, path[path.length - 1], module.state))
        // parent[path[path.length - 1]] = module.state // 非响应式，也能正常触发视图重新渲染
    }

    module.forEachMutation((mutation, key) => {
        store.mutations[namespace + key] = store.mutations[namespace + key] || []
        store.mutations[namespace + key].push(payload => mutation.call(store, getState(store, path), payload))
    })
    module.forEachAction((action, key) => {
        store.actions[namespace + key] = store.actions[namespace + key] || []
        store.actions[namespace + key].push(payload => action.call(store, store, payload))
    })
    module.forEachChildren((childModule, key) => {
        installMudole(store, path.concat(key), childModule, rootState) // childModule.state
    })
    // 没用namespace，则所有模块的getters默认都会合并到一个对象里，都是直接getters.xxx即可，而不用getters[a/xxx]
    module.forEachGetters((getterFn, key) => {
        store.wrapGetters[namespace + key] = () => getterFn.call(store, getState(store, path))
    })
}

export class Store {
    constructor (options) {
        // 格式化用户传入的配置，格式化成树结构
        this._modules = new ModuleCollection(options)

        this.mutations = {} // 将用户所有模块的mutation都放到这个对象中
        this.actions = {} // 将用户所有模块的action都放到这个对象中
        this.getters = {}
        this.wrapGetters = {} // 临时变量，存储getters
        const state = options.state // 用户传入的全局state，还是非响应式的
        this._subscribe = [] // 因为能传入多个插件，所以会有多个订阅
        this.strict = options.strict
        this._commiting = false
        this._withCommiting = function (fn) {
            const commiting = this._commiting
            this._commiting = true
            fn() // 修改状态的逻辑
            this._commiting = !commiting
        }

        // 将所有模块中的mutations和actions合并到全局上，合并state和getters到全局上
        installMudole(this, [], this._modules.root, state)
        // 初始化与重置（源码中因为需要对热更新进行判断，热更新需要重置，但这里就是单纯的初始化）
        // 主要干两件事：将state设置成响应式挂到store._vm上（通过new Vue），将getters挂到computed上
        resetStoreVM(this, state)

        // 默认插件就会被执行，从上往下执行
        options.plugins.forEach(plugin => plugin(this))
    }
    subscribe (fn) {
        this._subscribe.push(fn)
    }
    replaceState (newState) {
        this._withCommiting(() => (this._vm._data.$$state = newState))
    }
    get state () { // 属性访问器
        return this._vm._data.$$state
    }
    commit = (type, payload) => { // ES7语法，类的箭头函数，表示this永远指向store实例
        if (this.mutations[type]) {
            // 执行_withCommiting时，_commiting为true，所以不会报错
            // 如果mutations中有异步代码，那么异步代码执行后，触发watcher监听变化，此时的_commiting会为false，就会报错
            this._withCommiting(() => this.mutations[type].forEach(fn => fn(payload))) // 不同于之前，现在的mutations已经是个包含模块中mutations的数组

            // 变更后，触发插件订阅执行
            this._subscribe.forEach(fn => fn({ type, payload }, this.state))
        }
    }
    dispatch = (type, payload) => {
        if (this.actions[type]) {
            this.actions[type].forEach(fn => fn(payload))
        }
    }
}

// 这个方法是由于 installMudole 和 resetStoreVM 逻辑冲突导致的产物
// 因为 installMudole 中需要用到 state，而如果先将state设置成响应式的，则 resetStoreVM 添加计算属性会为空，反之又无法将响应式的 state 传入
function resetStoreVM (store, state) {
    const computed = {}

    forEachValue(store.wrapGetters, (fn, key) => {
        computed[key] = fn // 将是所有的属性放到computed中
        Object.defineProperty(store.getters, key, {
            get: () => store._vm[key]
        })
    })

    // 用户肯定是先使用 Vue.use，再进行 new Vue.Store({...})，所以这里的 Vue 已经是可以拿到构造函数的了
    // 必须放到f forEachValue 后面，确保 computed 已经有值
    store._vm = new Vue({
        data: {
            // Vue中不会对 $开头的属性进行代理操作（不会挂到_vm上进行代理）
            // 但是其属性依旧会被代理到（页面获取时依然会被收集依赖），因为我们不会直接操作state，而是操作state.xxx，性能优化
            $$state: state
        },
        computed
    })

    if (store.strict) {
        // 因为watcher执行时异步的，需要加上 {sync: true} 设置为同步，文档没有，需要自行看源码
        store._vm.$watch(() => store._vm._data.$$state, () => {
            console.assert(store._commiting, '非法操作')
        }, { sync: true, deep: true })
    }
}

// 搞得太花里胡哨，但最终还是在 vuex/index.js 中将 install和store 导出，所以这里怎么华丽花哨并不重要，能导出install进行mixin注入即可
// 实现原理依旧等同于 vue-router
export const install = (_Vue) => {
    Vue = _Vue
    applyMixin(Vue)
}
