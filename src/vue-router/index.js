// 拿到的是变量_Vue，所以Vue.use时就可以拿到Vue
import { install, _Vue } from './install'
import createMatcher from './create-matcher'
import HashHistory from './history/hash'
import BrowserHistory from './history/history'

export default class VueRouter {
    constructor (options) {
        // 根据用户的配置生成一个映射表，跳转时，根据路径找到对应的组件来进行渲染
        // 创建匹配器后，核心的方法就是匹配
        // 但用户可能还会动态的添加路由（match/addRoutes）
        this.matcher = createMatcher(options.routes || [])
        this.beforeEachHooks = [] // 不会实现其他的，参考queueWatcher是怎么去依次执行队列中的全部watcher的，解决方法一样

        // 根据当前的mode，创建不同的history管理策略
        switch (options.mode) {
            case 'hash':
                this.history = new HashHistory(this)
                break
            case 'history':
                this.history = new BrowserHistory(this)
                break
        }
    }

    match (location) {
        return this.matcher.match(location)
    }

    push (location) {
        this.history.push(location)
    }

    // 发布订阅模式
    beforeEach (fn) {
        this.beforeEachHooks.push(fn)
    }

    // 路由初始化
    init (app) { // app就是根实例 new Vue
        // 初始化后，需要先根据路径做一次匹配，后续根据hash值变化再次匹配
        const history = this.history // history的实例
        const setupListener = () => { // AOP切片编程
            history.setupListener() // 挂载监听，监听hash值变化
        }

        // 跳转到哪里，getCurrentLocation为私有，因为 hash与 history 处理不一致
        history.transitionTo(history.getCurrentLocation(), setupListener)

        history.listen(route => {
            app._route = route
        })
    }
}

VueRouter.install = install
