import { createdElement, createTextVnode } from './vdom/index.js'

export function renderMixin (Vue) {
    // 为什么要写在prototype上？因为render中传入this，也就是只能在vue中的方法和变量才能被获取到
    Vue.prototype._c = function (...args) { // 创建元素虚拟节点
        return createdElement(this, ...args)
    }

    Vue.prototype._v = function (text) { // 创建元文本拟节点
        return createTextVnode(this, text)
    }

    Vue.prototype._s = function (value) { // 鬓语法转化成字符串
        // 如果值是个对象，输出成对象字符串，否则输出值
        return value == null ? '' : (typeof value === 'object') ? JSON.stringify(value) : value
    }

    // 用于执行自定义render方法
    Vue.prototype._render = function () {
        const vm = this
        const render = vm.$options.render // 获取编译后的render方法

        // 调用render方法产生虚拟节点
        const vnode = render.call(vm) // 调用时会自动将变量进行取值
        return vnode
    }
}