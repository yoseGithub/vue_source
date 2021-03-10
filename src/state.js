import Dep from './observer/dep'
import { observe } from './observer/index'
import Watcher from './observer/watcher'
import { nextTick } from './util'

// 初始化状态
export function initState (vm) {
    // 将所有数据都定义在 vm 属性上，并且后续更改需要触发视图更新
    const opts = vm.$options // 获取用户属性

    // 加入options中有同名，查看属性的顺序：props -> methods -> data -> computed -> watch

    // 如果有data属性，初始化数据
    if (opts.data) {
        initData(vm)
    }

    if (opts.methods) {
        // 数据的初始化
    }

    if (opts.computed) {
        initComputed(vm)
    }
    
    if (opts.watch) {
        initWatch(vm)
    }
}

// 数据代理
function Proxy (vm, source, key) {
    Object.defineProperty(vm, key, {
        get () {
            return vm[source][key]
        },
        set (newValue) {
            vm[source][key] = newValue
        }
    })
}

// 初始化数据
function initData (vm) {
    // 数据劫持 Object.defineProperty
    let data = vm.$options.data

    // data 有可能是个对象，也可能是个函数，如果是个函数，获取函数返回值作为对象
    data = vm._data = typeof data === 'function' ? data.call(vm) : data // 这里最开头的data暂时没看出来有什么用

    // 通过 vm._data 获取劫持后的数据，用户就可以拿到 _data 了
    // 将 _data 中的数据全部放到 vm 上
    for (let key in data) {
        Proxy(vm, '_data', key)
    }

    // 观测数据
    observe(data)
}

// 初始化watcher
function initWatch (vm) {
    let watch = vm.$options.watch
    for (let key in watch) {
        const handler = watch[key]

        if (Array.isArray(handler)) {
            handler.forEach(handle => {
                createWatcher(vm, key, handler)
            })
        } else {
            createWatcher(vm, key, handler) // 字符串、对象、函数
        }
    }
}

function createWatcher (vm, exprOrFn, handler, options) { // options 可以用来标识是用户watcher
    if (typeof handler === 'object' && typeof handler !== 'null') {
        options = handler
        handler = handler.handler // 是一个函数
    }

    if (typeof handler === 'string') {
        handler = vm[handler] // 将实例的方法作为handler
    }

    return vm.$watch(exprOrFn, handler, options)
}

export function stateMixin (Vue) {
    Vue.prototype.$nextTick = function (cb) {
        nextTick(cb)
    }
    Vue.prototype.$watch = function (exprOrFn, cb, options) {
        // 数据应该迎来这个watcher，数据变化后应该让watcher从新执行
        let watcher = new Watcher(this, exprOrFn, cb, {...options, user: true}) // user: true 用于标识是用户写的侦听器，非渲染watcher
        if (options.immediate) {
            cb() // 如果是immediate，则立即执行
        }
    }
}

// 初始化计算属性
function initComputed (vm) {
    let computed = vm.$options.computed
    // 1. 需要有watcher 2. 需要通过defineProperty 3. dirty
    const watchers = vm._computedWatchers = {} // 用来存放计算属性的watcher

    for (let key in computed) {
        const userDef = computed[key]
        const getter = typeof userDef === 'function' ? userDef : userDef.get

        watchers[key] = new Watcher(vm, getter, () => {}, {lazy: true})
        defineComputed(vm, key, userDef)
    }
}

function defineComputed (target, key, userDef) {
    const sharedPropertyDefinition = {
        enumerable: true,
        configurable: true,
        get: () => {},
        set: () => {}
    }

    // 函数式
    if (typeof userDef === 'function') {
        sharedPropertyDefinition.get = createComputedGetter(key) // 通过dirty来控制是否调用userDef
    } else {
        sharedPropertyDefinition.get = createComputedGetter(key) // 需要加缓存
        sharedPropertyDefinition.set = userDef.set
    }

    Object.defineProperty(target, key, sharedPropertyDefinition)
}
// 用户取值时调用该方法
function createComputedGetter (key) {
    return function () { // 高阶函数，每次取值调用该方法
        const watcher = this._computedWatchers[key]
        if (watcher) {
            if (watcher.dirty) { // 判断是否需要执行用户传递的方法，默认肯定是脏的
                watcher.evaluate() // 对当前watcher求值
            }

            if (Dep.target) {
                watcher.depend()
            }

            return watcher.value // 默认返回watcher上存的值
        }
    }
}