import { isObject, isReservedTag } from "@/util.js"

// 创建 Dom虚拟节点
export function createdElement (vm, tag, data = {}, ...children) {
    // 需要对标签名做过滤，因为有可能标签名是一个自定义组件
    if (isReservedTag(tag)) {
        return vnode(vm, tag, data, data.key, children, undefined)
    } else {
        // 自定义组件
        const Ctor = vm.$options.components[tag] // Ctor是个对象或者函数
        // 核心：vue.extend，继承父组件，通过原型链向上查找，封装成函数
        return createComponent(vm, tag, data, data.key, children, Ctor)
    }
}

function createComponent (vm, tag, data, key, children, Ctor) {
    if (isObject(Ctor)) { // 对象，是个子组件，也封装成函数，统一
        Ctor = vm.$options._base.extend(Ctor)
    }

    // 给组件增加生命周期（源码中是抽离出去的，所以需要将vnode传进入，而不是直接使用Ctor）
    data.hook = {
        init (vnode) {
            // 调用子组件的构造函数，实例化组件
            const child = vnode.componentInstance = new vnode.componentOptions.Ctor({})
            child.$mount() // 手动挂载 vnode.componentInstance.$el = 真实的元素
        }
    }

    // 组件的虚拟节点拥有 hook 和当前组件的 componentOptions ，Ctor中存放了组件的构造函数
    return vnode(vm, `vue-component-${Ctor.cid}-${tag}`, data, key, undefined, undefined, {Ctor})
}

// 创建文本虚拟节点
export function createTextVnode (vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text)
}

function vnode (vm, tag, data, key, children, text, componentOptions) {
    return {
        vm,
        tag,
        children,
        data,
        key,
        text,
        componentOptions
    }
}