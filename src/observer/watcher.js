// watcher 记住dep是为了计算属性和让用户调用
import { popTarget, pushTarget } from "./dep"
import { queueWatcher } from "./schedular"

let id = 0

class Watcher {
    constructor (vm, exprOrFn, cb, options={}) {
        this.vm = vm
        this.cb = cb
        this.id = id++ // 不同组件id都不一样
        this.options = options
        this.user = options.user // 用户watcher
        this.getter = exprOrFn // 调用传入的函数
        this.deps = [] // watcher 里也要记住dep
        this.depsId = new Set()

        if (typeof exprOrFn === 'function') {
            this.getter = exprOrFn
        } else {
            this.getter = function () { // exprOrFn传递过来的可能是字符串，也可能是函数
                // 当去当前实例上取值时，才会触发依赖收集
                let path = exprOrFn.split('.')
                let obj = vm
                for (let i = 0; i < path.length; i++) {
                    obj = obj[path[i]]
                }
                return obj
            }
        }

        // 默认会先调用一次get方法，进行取值，将结果保存下来
        this.value = this.get()
    }
    // 这个方法中会对属性进行取值操作
    get () {
        pushTarget(this) // Dep.target = watcher
        let result = this.getter() // 取值
        popTarget()

        return result
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
        let newValue = this.get()
        let oldValue = this.value
        this.value = newValue // 将老值更改掉
        if (this.user) {
            this.cb.call(this.vm, newValue, oldValue)
        }
    }
    update () { // 多次更改，合并成一次（防抖）
        queueWatcher(this)
    }
}

export default Watcher