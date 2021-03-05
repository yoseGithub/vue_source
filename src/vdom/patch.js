import { isSameVnode } from './index.js'

// 将虚拟节点转换成真实节点，包括初次渲染和diff算法的逻辑
export function patch(oldVnode, vnode) {
    // 组件没有oldVnode，直接创建元素
    if (!oldVnode) {
        return createElm(vnode) // 根据虚拟节点创建元素
    }

    // oldVnode 第一次是一个真实的元素，也就是#app
    const isRealElement = oldVnode.nodeType

    if (isRealElement) {
        // 初次渲染
        const oldElm = oldVnode // id="app"
        const parentElm = oldElm.parentNode // body
        const el = createElm(vnode) // 根据虚拟节点创建真实节点
        // 将创建的节点插入到原有节点的下一个，因为不比vue template，index.html除了入口还可能有其他元素
        parentElm.insertBefore(el, oldElm.nextSibling)
        parentElm.removeChild(oldElm)
        return el // vm.$el
    } else {
        // 1. 如果两个虚拟节点的标签不一致，就直接替换掉
        if (oldVnode.tag !== vnode.tag) {
            return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el)
        }

        // 2. 标签一样，但是是两个文本元素（tag: undefined）
        if (!oldVnode.tag) {
            if (oldVnode.text !== vnode.text) {
                return oldVnode.el.textContent = vnode.text
            }
        }

        // 3. 元素相同，属性不同，复用老节点并且更新属性
        let el = vnode.el = oldVnode.el
        // 用老的属性和新的虚拟节点进行比对
        updateProperties(vnode, oldVnode.data)

        // 4. 更新子元素
        let oldChildren = oldVnode.children || []
        let newChildren = vnode.children || []

        if (oldChildren.length > 0 && newChildren.length > 0) { // 新的老的都有子元素，需要使用diff算法
            updateChildren(el, oldChildren, newChildren)
        } else if (oldChildren.length > 0) { // 1. 老的有子元素，新的没有子元素，删除老的子元素
            el.innerHTML = '' // 清空所有子节点
        } else if (newChildren.length > 0) { // 2. 新的有子元素，老的没有子元素，在老节点增加子元素即可
            newChildren.forEach(child => el.appendChild(createElm(child)))
        }
    }
}

function updateChildren (parent, oldChildren, newChildren) {
    let oldStartIndex = 0 // 老的父元素起始指针
    let oldEndIndex = oldChildren.length - 1 // 老的父元素终止指针
    let oldStartVnode = oldChildren[0] // 老的开始节点
    let oldEndVnode = oldChildren[oldEndIndex] // 老的结束节点

    let newStartIndex = 0 // 新的父元素起始指针
    let newEndIndex = newChildren.length - 1 // 新的父元素终止指针
    let newStartVnode = newChildren[0] // 新的开始节点
    let newEndVnode = newChildren[newEndIndex] // 新的结束节点

    // 创建字典表，用于乱序
    function makeIndexByKey (oldChildren) {
        let map = {}
        oldChildren.forEach((item, index) => {
            map[item.key] = index
        })
        return map
    }

    let map = makeIndexByKey(oldChildren)

    // 1. 前端中比较常见的操作有：尾部插入 头部插入 头部移动到尾部 尾部移动到头部 正序和反序
    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        if (!oldStartVnode) { // 乱序diff算法中处理过的虚拟节点
            oldStartVnode = oldChildren[++oldStartIndex]
        } else if (!oldEndVnode) { // 乱序diff算法中处理过的虚拟节点
            oldEndVnode = oldChildren[--oldEndIndex]
        } else if (isSameVnode(oldStartVnode, newStartVnode)) { // 向后插入操作，开始的虚拟节点一致
            patch(oldStartVnode, newStartVnode) // 递归比对节点
            oldStartVnode = oldChildren[++oldStartIndex]
            newStartVnode = newChildren[++newStartIndex]
        } else if (isSameVnode(oldEndVnode, newEndVnode)) { // 向前插入，开始的虚拟节点不一致，结束的虚拟节点一致
            patch(oldEndVnode, newEndVnode)
            oldEndVnode = oldChildren[--oldEndIndex]
            newEndVnode = newChildren[--newEndIndex]
        } else if (isSameVnode(oldStartVnode, newEndVnode)) { // 开始结束都不一致，旧的开始与新的结尾一致（头部插入尾部）
            patch(oldStartVnode, newEndVnode)
            parent.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling)
            oldStartVnode = oldChildren[++oldStartIndex]
            newEndVnode = newChildren[--newEndIndex]
        } else if (isSameVnode(oldEndVnode, newStartVnode)) { // 开始结束都不一致，旧的结尾与新的起始一致（尾部插入头部）
            patch(oldEndVnode, newStartVnode)
            parent.insertBefore(oldEndVnode.el, oldStartVnode.el)
            oldEndVnode = oldChildren[--oldEndIndex]
            newStartVnode = newChildren[++newStartIndex]
        } else { // 乱序diff算法，检测是否有可复用的key值，有则将原本节点移动，老的位置置为null，否则将新的节点插入进老的节点中来
            // 1. 需要先查找当前索引 老节点索引和key的关系
            // 移动的时候通过新的 key 去找对应的老节点索引 => 获取老节点，可以移动老节点
            let moveIndex = map[newStartVnode.key]
            if (moveIndex === undefined) { // 不在字典中存在，是个新节点，直接插入
                parent.insertBefore(createElm(newStartVnode), oldStartVnode.el)
            } else {
                let moveVnode = oldChildren[moveIndex]
                oldChildren[moveIndex] = undefined // 表示该虚拟节点已经处理过，后续递归时可直接跳过
                patch(moveVnode, newStartVnode) // 如果找到了，需要两个虚拟节点对比
                parent.insertBefore(moveVnode.el, oldStartVnode.el)
            }
            newStartVnode = newChildren[++newStartIndex]
        }
    }

    // 新的比老的多，插入新节点
    if (newStartIndex <= newEndIndex) {
        // 将多出来的节点一个个插入进去
        for (let i = newStartIndex; i <= newEndIndex; i++) {
            // 排查下一个节点是否存在，如果存在证明指针是从后往前（insertBefore），反之指针是从头往后（appendChild）
            let nextEle = newChildren[newEndIndex + 1] === undefined ? null : newChildren[newEndIndex + 1].el
            // 这里不需要分情况使用 appendChild 或 insertBefore
            // 如果 insertBefore 传入 null，等价于 appendChild
            parent.insertBefore(createElm(newChildren[i]), nextEle)
        }
    }

    // 老的比新的多，删除老节点
    if (oldStartIndex <= oldEndIndex) {
        for (let i = oldStartIndex; i <= oldEndIndex; i++) {
            let child = oldChildren[i]
            if (child !== undefined) { // 有可能是遍历到已经被使用过的虚拟节点，需要排除掉
                parent.removeChild(child.el)
            }
        }
    }
}

// 创建节点真实Dom
function createComponent (vnode) {
    let i = vnode.data
    // 先将vnode.data赋值给i，然后将i.hook赋值给i，如果i存在再将i.init赋值给i，疯狂改变i的类型，虽然js中都属于Object，但真的好吗…
    if ((i = i.hook) && (i = i.init)) {
        i(vnode) // 调用组件的初始化方法
    }

    if (vnode.componentInstance) { // 如果虚拟节点上又组件的实例说明当前这个vnode是组件
        return true
    }

    return false
}

export function createElm (vnode) { // 根据虚拟节点创建真实节点，不同于createElement
    let { vm, tag, data, key, children, text } = vnode    

    if (typeof tag === 'string') {
        // 可能是组件，如果是组件，就直接创造出组件的真实节点
        if (createComponent(vnode)) {
            // 如果返回true，说明这个虚拟节点是组件
            return vnode.componentInstance.$el
        }

        vnode.el = document.createElement(tag) // 用vue的指令时，可以通过vnode拿到真实dom
        updateProperties(vnode)
        children.forEach(child => {
            vnode.el.appendChild(createElm(child)) // 递归创建插入节点，现代浏览器appendChild并不会插入一次回流一次
        })
    } else {
        vnode.el = document.createTextNode(text)
    }

    return vnode.el
}

// 更新属性，注意这里class与style无法处理表达式，因为从前面解析的时候就没处理，还是那句，重点不在完全实现，而是学习核心思路
function updateProperties (vnode, oldProps = {}) {
    const newProps = vnode.data || {}
    const el = vnode.el

    // 1. 老的属性，新的没有，删除属性
    // 前面提到过一次，以前vue1需要考虑重绘，现在新版浏览器已经会做合并，所以不用再去考虑使用documentFlagment来优化了
    for (let key in oldProps) {
        if (!newProps[key]) {
            el.removeAttribute(key)
        }
    }

    let newStyle = newProps.style || {}
    let oldStyle = oldProps.style || {}
    for (let key in oldStyle) { // 新老样式先进行比对，删除新vnode中没有的样式
        if (!newStyle[key]) {
            el.style[key] = ''
        }
    }

    // 2. 新的属性，老的没有，直接用新的覆盖，不用考虑有没有
    for (let key in newProps) {
        if (key === 'style') {
            for (let styleName in newProps.style) {
                el.style[styleName] = newProps.style[styleName]
            }
        } else if (typeof tag === 'class') { // 静态的class可以没有这段，但还是写上，假装如果是class可以处理简单的表达式
            vnode.className = newProps.class
        } else {
            el.setAttribute(key, newProps[key])
        }
    }
}