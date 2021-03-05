// watcher 记住dep是为了计算属性和让用户调用
import { popTarget, pushTarget } from "./dep"
import { queueWatcher } from "./schedular"

let id = 0

class Watcher {
    constructor (vm, exprOrFn, cb, options) {
        this.vm = vm
        this.cb = cb
        this.id = id++ // 不同组件id都不一样
        this.options = options
        this.getter = exprOrFn // 调用传入的函数
        this.deps = [] // watcher 里也要记住dep
        this.depsId = new Set()

        this.get()
    }
    // 这个方法中会对属性进行取值操作
    get () {
        pushTarget(this) // Dep.target = watcher
        this.getter() // 取值
        popTarget()
    }
    // 当属性取值时，需要记住这个watcher，稍后数据变化了，去执行自己记住的watcher即可
    addDep (dep) {
        let id = dep.id
        if (!this.depsId.has(id)) { // dep是非重复的
            this.depsId.add(id)
            this.deps.push(dep)
            dep.addSub(this)
        }
    }
    // 真正触发更新
    run () {
        this.get()
    }
    update () { // 多次更改，合并成一次（防抖）
        queueWatcher(this)
    }
}

export default Watcher