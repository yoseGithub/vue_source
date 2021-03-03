import Watcher from './observer/watcher.js'
import { patch } from './vdom/patch.js'

export function lifecycleMixin (Vue) {
    // 视图更新方法，用于渲染真实DOM
    Vue.prototype._update = function (vnode) {
        const vm = this

        // 首次渲染，需要用虚拟节点，来更新真实的dom元素
        // 第一次渲染完毕后 拿到新的节点，下次再次渲染时替换上次渲染的结果
        vm.$el = patch(vm.$el, vnode) // 组件调用patch方法后会产生$el属性
    }
}

// 调用合并的生命周期，依次执行
export function callHook (vm, hook) { // 发布模式
    const handlers = vm.$options[hook]
    if (handlers) {
        handlers.forEach(handlers => handlers.call(vm)) // 这也就是为什么vue的什么周期不能用箭头函数，call将无效，this指向了window而不是vm
    }
}

export function mountComponent (vm) {
    let updateComponent = () => {
        vm._update(vm._render()) // vm._render()返回虚拟节点，update返回真实节点
    }

    // 默认vue是通过watcher来渲染的 渲染watcher（每一个组件都有一个渲染watcher）
    new Watcher(vm, updateComponent, () => {}, true)
}