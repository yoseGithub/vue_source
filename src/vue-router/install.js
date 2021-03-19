import RouteLink from './components/link'
import RouteView from './components/view'

// 需要将install方法单独的进行拆分
export let _Vue

export function install (Vue, options) {
    // 如果已经注册过router并且是同一个Vue实例，直接返回
    if (install.installed && _Vue === Vue) { return }
    install.installed = true
    _Vue = Vue

    // 将当前的根实例提供的router属性共享给所有子组件
    Vue.mixin({
        beforeCreate () {
            // 获取到每个子组件的实例，给实例添加属性
            if (this.$options.router) {
                this._routerRoot = this // 把根实例挂到_routerRoot上，new Vue()
                this._router = this.$options.router // 路由实例 new vueRouter()
                this._router.init(this)

                // 使用 Vue 的工具类方法定义成响应式的，真实项目需要使用 $set，这里没法用是因为Vue还未实例化
                Vue.util.defineReactive(this, '_route', this._router.history.current)
            } else {
                // this._routerRoot指向当前根组件实例，由 lifecycleMixin 构建父子关系
                // _routerRoot是一层层往上找的，并非直接挂载在Vue的原型上
                this._routerRoot = this.$parent && this.$parent._routerRoot
            }
        }
    })

    // 让用户可以直接使用 vue.$route 和 $router
    Object.defineProperty(Vue.prototype, '$route', {
        get () {
            return this._routerRoot._route // current对象里面的所有属性
        }
    })

    Object.defineProperty(Vue.prototype, '$router', {
        get () {
            return this._routerRoot._router // addRoute match 方法等
        }
    })

    // 注册所需组件
    Vue.component('router-link', RouteLink)
    Vue.component('router-view', RouteView)
}
