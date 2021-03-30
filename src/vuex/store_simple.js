// 简易版vuex实现，无modules
import { applyMixin } from './mixin'

const forEachValue = (obj, cb) => {
    Object.keys(obj).forEach(key => cb(obj[key], key))
}

export let Vue // 此 Vue 是用户注册插件时传入的 Vue 构造函数
export class Store {
    constructor (options) {
        const computed = {}

        // getters实现
        this.getters = {}
        forEachValue(options.getters, (value, key) => {
            // 通过计算属性替换直接执行函数获取值的形式，计算属性具备缓存
            computed[key] = () => value.call(this, this.state)

            // value 是函数，getter 获取的是属性值，所以在获取的时候再去执行函数获取其对应的值
            // 而且这样操作是每次取值时都能取到最新结果，否则直接执行函数取值后面就没法变更了
            Object.defineProperty(this.getters, key, {
                // 这里要用箭头函数保证this指向，否则里面就不能用 call(this)
                get: () => {
                    // 用call是为了防止用户在 getters 中使用了this，当然正常都是通过传入的state state.xxx，而不是 this.state.xxx
                    // return value.call(this, this.state) // 每次取值都会重新执行用户方法，性能差，所以需要替换成计算属性取值
                    return this._vm[key]
                }
            })
        })

        // 用户肯定是先使用 Vue.use，再进行 new Vue.Store({...})，所以这里的 Vue 已经是可以拿到构造函数的了
        // 必须放到f forEachValue 后面，确保 computed 已经有值
        this._vm = new Vue({
            data: {
                // Vue中不会对 $开头的属性进行代理操作（不会挂到_vm上进行代理）
                // 但是其属性依旧会被代理到（页面获取时依然会被收集依赖），因为我们不会直接操作state，而是操作state.xxx，性能优化
                $$state: options.state
            },
            computed
        })

        // mutations实现
        this.mutations = {}
        this.actions = {}

        forEachValue(options.mutations, (fn, key) => {
            this.mutations[key] = payload => fn.call(this, this.state, payload)
        })

        forEachValue(options.actions, (fn, key) => {
            this.actions[key] = payload => fn.call(this, this, payload)
        })
    }
    get state () { // 属性访问器
        return this._vm._data.$$state
    }
    commit = (type, payload) => { // ES7语法，类的箭头函数，表示this永远指向store实例
        this.mutations[type](payload)
    }
    dispath = (type, payload) => {
        this.actions[type](payload)
    }
}

// 搞得太花里胡哨，但最终还是在 vuex/index.js 中将 install和store 导出，所以这里怎么华丽花哨并不重要，能导出install进行mixin注入即可
// 实现原理依旧等同于 vue-router
export const install = (_Vue) => {
    Vue = _Vue
    applyMixin(Vue)
}
