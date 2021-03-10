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
        this.lazy = options.lazy // 如果watcher上有lazy属性，说明是一个计算属性
        this.dirty = this.lazy // dirty代表取值时是否执行用户提供的方法，可变
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
        // 如果是计算属性，则什么都不做（计算属性默认不执行）
        this.value = this.lazy ? void 0 : this.get()
    }
    // 这个方法中会对属性进行取值操作
    get () {
        pushTarget(this) // Dep.target = watcher
        // data属性取值，触发updateComponent，其中this指向的时vm
        // computed属性取值，会执行绑定的函数，该函数中的this指向的是该watcher，所以this指向会有问题，需要call(this.vm)
        let result = this.getter.call(this.vm)
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
        if (this.lazy) {
            this.dirty = true
        } else {
            // 这里不要每次都调用get方法，get会重新渲染页面
            queueWatcher(this)
        }
    }
    evaluate () {
        this.value = this.get()
        this.dirty = false // 取过值后标识，标识已经取过值了
    }
    depend () {
        // 计算属性watcher会存储dep，dep会存储watcher
        // 通过watcher找到对应的所有dep，让所有的dep都记住这个渲染watcher
        let i = this.deps.length
        while (i--) {
            this.deps[i].depend()
        }
    }
}

export default Watcher