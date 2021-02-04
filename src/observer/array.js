 // 不能直接改写数组原方法，也就是不能直接 Array.prototype.push = fn 直接改写，这样数组原功能也会被覆盖掉
// 需要通过 Object.create(Array.prototype) 来创建一个对象，通过原型链来获取到数组的方法
let oldArrayMethods = Array.prototype

export let arrayMethods = Object.create(Array.prototype)
// 7个会改变原数组的方法，而其他诸如concat slice等都不会改变原数组
let methods = ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse', 'sort']

// AOP切片编程
methods.forEach(method => {
    arrayMethods[method] = function (...args) {
        // 有可能用户新增的数据是对象，也需要进行拦截，比如 vm._data.arr.push({a: 1})
        let inserted
        let ob = this.__ob__
        switch (method) {
            case 'push':
            case 'unshift':
                inserted = args
                break;
            case 'splice': // splice(0, 1, xxx)
                inserted = args.slice(2)
            default: break;
        }

        // 如果有值则需要使用 observeArray 方法，通过 Observer 中对每一项进行监控时，如果为数组则会在该数组属性上挂上数组遍历方法
        if (inserted) {
            ob.observeArray(inserted)
        }

        // 调用数组原有方法执行
        const result = oldArrayMethods[method].call(this, ...args)
        return result
    }
})
