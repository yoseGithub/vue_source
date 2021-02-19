import { arrayMethods } from './array.js'
import Dep from './dep.js'

class Observer {
    constructor (value) { // value 最初为 data 传入的每一项数据
        // 这一句是为了在 arrayMethods中可以使用 observeArray 方法，如果是数组，则会在数组上挂载一个 Observer 实例
        // 在数组arrayMethods拦截中可以使用 observeArray 来对数组进行观测
        this.dep = new Dep() // 给数组本身和对象本身增加一个dep属性

        Object.defineProperty(value, '__ob__', {
            value: this,
            enumerable: false, // 不能被枚举，否则会导致死循环
            configurable: false // 不能删除此属性
        })

        // value可能是对象 也可能是数组，需要分开处理
        if (Array.isArray(value)) {
            // value.__ob__ = this

            // 数组不用defineProperty来进行代理 性能不好
            // 如果是数组，则将数组原型链指向被劫持后的数组，这样如果是改变数组的方法则会先被劫持，否则通过原型链使用数组方法
            Object.setPrototypeOf(value, arrayMethods)
            this.observeArray(value) // 原有数组中的对象
            // value.__proto__ = arrayMethods // 同上，但这种写法非标准。个人文章：https://www.jianshu.com/p/28a0164b0d63
        } else {
            this.walk(value)
        }
    }
    // 监控数组中是否为对象，如果是则进行劫持
    observeArray (value) {
        for (let i = 0; i < value.length; i++) {
            observe(value[i])
        }
    }
    walk (data) {
        // 将对象中所有的key 重新用 defineProperty定义成响应式的
        Object.keys(data).forEach((key) => {
            defineReactive(data, key, data[key])
        })
    }
}

function dependArray (value) {
    for (let i = 0; i < value.length; i++) {
        let current = value[i]
        current.__ob__ && current.__ob__.dep.depend()

        if (Array.isArray(current)) {
            dependArray(current) // 递归依赖收集
        }
    }
}

export function defineReactive (data, key, value) { // vue2中数据嵌套不要过深，过深浪费性能
    // value可能也是一个对象，需要再次递归
    const childOb = observe(value) // 对结果递归拦截

    let dep = new Dep() // 每次都会给属性创建一个dep
    Object.defineProperty(data, key, { // 需要给每个属性都添加一个Dep
        get () {
            if (Dep.target) {
                dep.depend() // 让这个属性自己的dep记住这个watcher

                // childOb可能是对象，也可能是数组
                if (childOb) {
                    childOb.dep.depend()
                    if (Array.isArray(value)) {
                        dependArray(value)
                    }
                }
            }
            return value
        },
        set (newValue) {
            // 值没变化，无需重新设置
            if (newValue === value) return
            observe(newValue) // 如果用户设置的是一个对象，就继续将用户设置的对象变成响应式的
            value = newValue

            dep.notify() // 通知 dep 中记录的 wathcer 让它去执行
        }
    })
}

export function observe (data) {
    if (typeof data !== 'object' || data == null) return

    if (data.__ob__) return // 如果有__ob__，证明已经被观测了

    // 通过类来实现对数据的观测，类可以方便拓展，会产生实例
    return new Observer(data)
}