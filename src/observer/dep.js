// dep存在的意义：watcher是为了监听，取值的时候会触发记录
let id= 0

class Dep {
    constructor () {
        this.id = id++
        this.subs = [] // 属性要记住watcher
    }
    // 如果有报错可自行安装babel插件（@babel/plugin-proposal-class-properties），又或者在外部写成 Dep.target = null
    static target = null
    depend () {
        // 让watcher记住dep
        Dep.target.addDep(this) // this为渲染watcher
    }
    addSub (watcher) {
        this.subs.push(watcher)
    }
    notify () {
        this.subs.forEach(watcher => watcher.update())
    }
}

export function pushTarget (watcher) {
    Dep.target = watcher
}

export function popTarget (watcher) {
    Dep.target = null
}

export default Dep