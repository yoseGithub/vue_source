let id = 0

class Watcher {
    constructor (vm, fn, cb, options) {
        this.vm = vm
        this.fn = fn
        this.cb = cb
        this.id = id++ // 不同组件id都不一样
        this.options = options

        this.fn() // 调用传入的函数
    }
}

export default Watcher