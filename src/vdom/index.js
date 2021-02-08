// 创建 Dom虚拟节点
export function createdElement (vm, tag, data = {}, ...children) {
    return vnode(vm, tag, data, data.key, children, undefined)
}

// 创建文本虚拟节点
export function createTextVnode (vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text)
}

function vnode (vm, tag, data, key, children, text) {
    return {
        vm,
        tag,
        children,
        data,
        key,
        text
    }
}