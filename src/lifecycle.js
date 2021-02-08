import Watcher from './observer/watcher.js'
import { patch } from './vdom/patch.js'

export function lifecycleMixin (Vue) {
    // 视图更新方法，用于渲染真实DOM
    Vue.prototype._update = function (vnode) {
        const vm = this

        // 首次渲染，需要用虚拟节点，来更新真实的dom元素
        vm.$el = patch(vm.$options.el, vnode)
    }
}

export function mountComponent (vm, el) {
    let updateComponent = () => {
        vm._update(vm._render()) // vm._render()返回虚拟节点，update返回真实节点
    }

    // 默认vue是通过watcher来渲染的 渲染watcher（每一个组件都有一个渲染watcher）
    new Watcher(vm, updateComponent, () => {}, true)
}