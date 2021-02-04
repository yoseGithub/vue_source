import { observe } from './observer/index'

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