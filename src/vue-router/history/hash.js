import History from './base'

// 判断链接是否带有hash，没有则添加#/，否则不添加
function ensureSlash () {
    if (window.location.hash) { return }
    window.location.hash = '/' // url如果不带hash，自动添加 #/
}

function getHash () {
    return window.location.hash.slice(1)
}

export default class HashHistory extends History {
    constructor (router) {
        super(router)

        // 默认hash模式需要加 #/
        ensureSlash()
    }

    setupListener () {
        // 好陌生，查了一下事件居然有这么多：https://www.runoob.com/jsref/dom-obj-event.html
        // hashchange性能不如 popstate，popstate用于监听浏览器历史记录变化，hash变化也会触发popstate
        window.addEventListener('popstate', () => {
            // 根据当前hash值，去匹配对应的组件
            this.transitionTo(getHash())
        })
    }

    getCurrentLocation () {
        return getHash()
    }

    push (location) {
        window.location.hash = location
    }
}
