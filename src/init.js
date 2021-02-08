import { initState } from './state'
import { compileToFunctions } from './compiler/index.js'
import { mountComponent } from './lifecycle.js'

// 通过原型混合的方式，往vue的原型添方法
export function initMixin (Vue) {
    Vue.prototype._init = function (options) {
        const vm = this
        // 实例上有个属性 $options ，表示的是用户传入的所有属性
        vm.$options = options

        // 初始化状态
        initState(vm)

        // 数据可以挂载到页面上
        if (vm.$options.el) {
            vm.$mount(vm.$options.el)
        }
    }

    Vue.prototype.$mount = function (el) {
        el = document.querySelector(el)
        const vm = this
        const options = vm.$options
        vm.$options.el = el

        // 如果有render 就直接使用 render
        // 没有render 看有没有template属性
        // 没有template 就接着找外部模板
        if (!options.render) {
            let template = options.template
            if (!template && el) {
                // 返回内容包含描述元素及其后代的序列化HTML片段，火狐不兼容，可以使用document。createElement('div').appendChild('app').innerHTML来获取
                template = el.outerHTML
            }
            const render = compileToFunctions(template)
            options.render = render // 通过这个步骤，统一为render
        }

        mountComponent(vm, el) // 组件挂载
    }
}