// 将虚拟节点转换成真实节点
export function patch(oldVnode, vnode) {
    // 组件没有oldVnode，直接创建元素
    if (!oldVnode) {
        return createdElm(vnode) // 根据虚拟节点创建元素
    }

    // oldVnode 第一次是一个真实的元素，也就是#app
    const isRealElement = oldVnode.nodeType

    if (isRealElement) {
        // 初次渲染
        const oldElm = oldVnode // id="app"
        const parentElm = oldElm.parentNode // body
        const el = createdElm(vnode) // 根据虚拟节点创建真实节点
        // 将创建的节点插入到原有节点的下一个，因为不比vue template，index.html除了入口还可能有其他元素
        parentElm.insertBefore(el, oldElm.nextSibling)
        parentElm.removeChild(oldElm)
        return el // vm.$el
    } else {
        // diff算法

    }
}

// 创建节点真实Dom
function createComponent (vnode) {
    console.log(vnode)
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

function createdElm (vnode) { // 根据虚拟节点创建真实节点，不同于createElement
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
            vnode.el.appendChild(createdElm(child)) // 递归创建插入节点，现代浏览器appendChild并不会插入一次回流一次
        })
    } else {
        vnode.el = document.createTextNode(text)
    }

    return vnode.el
}

// 更新属性，注意这里class与style无法处理表达式，因为从前面解析的时候就没处理，还是那句，重点不在完全实现，而是学习核心思路
function updateProperties (vnode) {
    const newProps = vnode.data || {}
    const el = vnode.el

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