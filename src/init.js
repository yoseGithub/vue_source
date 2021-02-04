import { initState } from './state'

// 通过原型混合的方式，往vue的原型添方法
export default function initMixin (Vue) {
    Vue.prototype._init = function (options) {
        const vm = this
        // 实例上有个属性 $options ，表示的是用户传入的所有属性
        vm.$options = options

        // 初始化状态
        initState(vm)
    }
}