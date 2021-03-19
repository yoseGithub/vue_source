import History from './base'

export default class BrowserHistory extends History {
    // eslint-disable-next-line no-useless-constructor
    constructor (router) {
        super(router)
    }

    getCurrentLocation () {
        return window.location.pathname
    }

    setupListener () {
        window.addEventListener('popstate', () => {
            // 监听路径变化（浏览器的前进后退）进行跳转
            this.transitionTo(this.getCurrentLocation())
        })
    }

    push (location) {
        this.transitionTo(location, () => {
            // 采用 H5 的 API 跳转，这里的切换不会触发 popstate，所以不能像hash一样，需要放到回调中来处理
            window.history.pushState({}, null, location)
        })
    }
}
