网上找的图，懒得自己画，毕竟本人PS一般（程序员程度的一般，对比设计师为未毕业渣渣级）

![diff算法](https://upload-images.jianshu.io/upload_images/13936697-2ee5d90a81c55c9c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

在这里也多说一句，节点对比不属于diff算法，diff算法仅对于父节点一致，并且都有子节点的时候才需要用到，其他的就是简单的逻辑判断一直去`if...else if...`而已
开发准备工作，创建两个vnode，前面方法已经实现了，直接调用即可（开发完删除即可）。
```js
// index.js
import { compileToFunctions } from './compiler/index.js'
import { createdElm, patch } from './vdom/patch.js'

// 构建两个虚拟Dom
let vm1 = new Vue({
    data () {
        return {
            name: 'yose'
        }
    }
})

let render1 = compileToFunctions(`<div id="a" a="1" style="color: red">{{name}}</div>`) // 将模板变为render函数
let oldVnode = render1.call(vm1) // 老的虚拟节点
let el = createdElm(oldVnode) // 创建真实节点
document.body.appendChild(el)

let vm2 = new Vue({
    data () {
        return {
            name: 'Catherine'
        }
    }
})

let render2 = compileToFunctions(`<div id="b" b="1" style="background: blue">{{name}}</div>`) // 将模板变为render函数
let newVnode = render2.call(vm2) // 老的虚拟节点

setTimeout(() => {
    patch(oldVnode, newVnode)
}, 2000)
``` 

#### 父元素对比
patch负责两件事：渲染成真实Dom（初渲染）及diff算法，之前diff已经预留过，非真实节点`!isRealElement`走diff算法，现在就是来完善diff

父元素对比情况列举：
1. 对比父节点标签，如果不一致，直接替换
2. 标签一致，但是为文本标签（`tag`为`undefined`），替换文本内容
3. 标签一致，非文本标签，但是属性不同，复用老节点并且更新属性
```js
// vdom/patch.js
export function patch(oldVnode, vnode) {
    if (isRealElement) {
        // code...
    } else {
+       // 1. 如果两个虚拟节点的标签不一致，就直接替换掉
+       if (oldVnode.tag !== vnode.tag) {
+           return oldVnode.el.parentNode.replaceChild(createdElm(vnode), oldVnode.el)
+       }

+       // 2. 标签一样，但是是两个文本元素（tag: undefined）
+       if (!oldVnode.tag) {
+           if (oldVnode.text !== vnode.text) {
+               return oldVnode.el.textContent = vnode.text
+           }
+       }

+       // 3. 元素相同，属性不同，复用老节点并且更新属性
+       let el = vnode.el = oldVnode.el
+       // 用老的属性和新的虚拟节点进行比对
+       updateProperties(vnode, oldVnode.data)

+       // 4. 更新子元素
+       let oldChildren = oldVnode.children || []
+       let newChildren = vnode.children || []

+       if (oldChildren.length > 0 && newChildren.length > 0) { // 新的老的都有子元素，需要使用diff算法

+       } else if (oldChildren.length > 0) { // 1. 老的有子元素，新的没有子元素，删除老的子元素
+           el.innerHTML = '' // 清空所有子节点
+       } else if (newChildren.length > 0) { // 2. 新的有子元素，老的没有子元素，在老节点增加子元素即可
+           newChildren.forEach(child => el.appendChild(createElm(child)))
+       }
    }
}

// 更新属性，注意这里class与style无法处理表达式，因为从前面解析的时候就没处理，还是那句，重点不在完全实现，而是学习核心思路
function updateProperties (vnode, oldProps = {}) {
    const newProps = vnode.data || {}
    const el = vnode.el

+   // 1. 老的属性，新的没有，删除属性
+   // 前面提到过一次，以前vue1需要考虑重绘，现在新版浏览器已经会做合并，所以不用再去考虑使用documentFlagment来优化了
+   for (let key in oldProps) {
+       if (!newProps[key]) {
+           el.removeAttribute(key)
+       }
+   }

+   let newStyle = newProps.style || {}
+   let oldStyle = oldProps.style || {}
+   for (let key in oldStyle) { // 新老样式先进行比对，删除新vnode中没有的样式
+       if (!newStyle[key]) {
+           el.style[key] = ''
+       }
+   }

    // 2. 新的属性，老的没有，直接用新的覆盖，不用考虑有没有
    // 原本code...
}
```

#### diff算法
diff算法是当父元素一致，并且都有子节点的情况下使用的
diff算法是借鉴于**snabbdom.js**的，有兴趣的可自行拓展了解
diff算法的核心思路是去操作vnode，通过vnode来排查是否需要重新创建节点，而不是直接去访问真实节点（减少过桥费）
对到节点，能移动的采用移动，能复用的节点则复用，不能移动或复用的才创建插入（减少节点的销毁创建，因为Dom操作是具备移动性的，会移动节点，Dom映射）
还要注意一点，对比使用的vnode，移动真实Dom（这句在下面代码最后一个情景里自行体会，比如后面比对可复用，会将节点置为null，置null的是虚拟节点，真实节点是直接移动）

```diff
// vdom\index.js
// 是否为相同虚拟节点
+ export function isSameVnode (oldVnode, newVnode) {
+     return (oldVnode.tag === newVnode.tag) && (oldVnode.key === newVnode.key)
+ }
```
diff算法主要实现逻辑代码
```diff
export function patch(oldVnode, vnode) {
    // code...

    if (isRealElement) {
        // code...
+   } else {
+       // 1. 如果两个虚拟节点的标签不一致，就直接替换掉
+       if (oldVnode.tag !== vnode.tag) {
+           return oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el)
+       }
+
+       // 2. 标签一样，但是是两个文本元素（tag: undefined）
+       if (!oldVnode.tag) {
+           if (oldVnode.text !== vnode.text) {
+               return oldVnode.el.textContent = vnode.text
+           }
+       }
+
+       // 3. 元素相同，属性不同，复用老节点并且更新属性
+       let el = vnode.el = oldVnode.el
+       // 用老的属性和新的虚拟节点进行比对
+       updateProperties(vnode, oldVnode.data)
+
+       // 4. 更新子元素
+       let oldChildren = oldVnode.children || []
+       let newChildren = vnode.children || []
+
+       if (oldChildren.length > 0 && newChildren.length > 0) { // 新的老的都有子元素，需要使用diff算法
+           updateChildren(el, oldChildren, newChildren)
+       } else if (oldChildren.length > 0) { // 1. 老的有子元素，新的没有子元素，删除老的子元素
+           el.innerHTML = '' // 清空所有子节点
+       } else if (newChildren.length > 0) { // 2. 新的有子元素，老的没有子元素，在老节点增加子元素即可
+           newChildren.forEach(child => el.appendChild(createElm(child)))
+       }
+   }
}

+ // diff算法主要逻辑
+ function updateChildren (parent, oldChildren, newChildren) {
+     let oldStartIndex = 0 // 老的父元素起始指针
+     let oldEndIndex = oldChildren.length - 1 // 老的父元素终止指针
+     let oldStartVnode = oldChildren[0] // 老的开始节点
+     let oldEndVnode = oldChildren[oldEndIndex] // 老的结束节点
+ 
+     let newStartIndex = 0 // 新的父元素起始指针
+     let newEndIndex = newChildren.length - 1 // 新的父元素终止指针
+     let newStartVnode = newChildren[0] // 新的开始节点
+     let newEndVnode = newChildren[newEndIndex] // 新的结束节点
+ 
+     // 创建字典表，用于乱序
+     function makeIndexByKey (oldChildren) {
+         let map = {}
+         oldChildren.forEach((item, index) => {
+             map[item.key] = index
+         })
+         return map
+     }
+ 
+     let map = makeIndexByKey(oldChildren)
+ 
+     // 1. 前端中比较常见的操作有：尾部插入 头部插入 头部移动到尾部 尾部移动到头部 正序和反序
+     while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
+         if (!oldStartVnode) { // 乱序diff算法中处理过的虚拟节点
+             oldStartVnode = oldChildren[++oldStartIndex]
+         } else if (!oldEndVnode) { // 乱序diff算法中处理过的虚拟节点
+             oldEndVnode = oldChildren[--oldEndIndex]
+         } else if (isSameVnode(oldStartVnode, newStartVnode)) { // 向后插入操作，开始的虚拟节点一致
+             patch(oldStartVnode, newStartVnode) // 递归比对节点
+             oldStartVnode = oldChildren[++oldStartIndex]
+             newStartVnode = newChildren[++newStartIndex]
+         } else if (isSameVnode(oldEndVnode, newEndVnode)) { // 向前插入，开始的虚拟节点不一致，结束的虚拟节点一致
+             patch(oldEndVnode, newEndVnode)
+             oldEndVnode = oldChildren[--oldEndIndex]
+             newEndVnode = newChildren[--newEndIndex]
+         } else if (isSameVnode(oldStartVnode, newEndVnode)) { // 开始结束都不一致，旧的开始与新的结尾一致（头部插入尾部）
+             patch(oldStartVnode, newEndVnode)
+             parent.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling)
+             oldStartVnode = oldChildren[++oldStartIndex]
+             newEndVnode = newChildren[--newEndIndex]
+         } else if (isSameVnode(oldEndVnode, newStartVnode)) { // 开始结束都不一致，旧的结尾与新的起始一致（尾部插入头部）
+             patch(oldEndVnode, newStartVnode)
+             parent.insertBefore(oldEndVnode.el, oldStartVnode.el)
+             oldEndVnode = oldChildren[--oldEndIndex]
+             newStartVnode = newChildren[++newStartIndex]
+         } else { // 乱序diff算法，检测是否有可复用的key值，有则将原本节点移动，老的位置置为null，否则将新的节点插入进老的节点中来
+             // 1. 需要先查找当前索引 老节点索引和key的关系
+             // 移动的时候通过新的 key 去找对应的老节点索引 => 获取老节点，可以移动老节点
+             let moveIndex = map[newStartVnode.key]
+             if (moveIndex === undefined) { // 不在字典中存在，是个新节点，直接插入
+                 parent.insertBefore(createElm(newStartVnode), oldStartVnode.el)
+             } else {
+                 let moveVnode = oldChildren[moveIndex]
+                 oldChildren[moveIndex] = undefined // 表示该虚拟节点已经处理过，后续递归时可直接跳过
+                 patch(moveVnode, newStartVnode) // 如果找到了，需要两个虚拟节点对比
+                 parent.insertBefore(moveVnode.el, oldStartVnode.el)
+             }
+             newStartVnode = newChildren[++newStartIndex]
+         }
+     }
+ 
+     // 新的比老的多，插入新节点
+     if (newStartIndex <= newEndIndex) {
+         // 将多出来的节点一个个插入进去
+         for (let i = newStartIndex; i <= newEndIndex; i++) {
+             // 排查下一个节点是否存在，如果存在证明指针是从后往前（insertBefore），反之指针是从头往后（appendChild）
+             let nextEle = newChildren[newEndIndex + 1] === undefined ? null : newChildren[newEndIndex + 1].el
+             // 这里不需要分情况使用 appendChild 或 insertBefore
+             // 如果 insertBefore 传入 null，等价于 appendChild
+             parent.insertBefore(createElm(newChildren[i]), nextEle)
+         }
+     }
+ 
+     // 老的比新的多，删除老节点
+     if (oldStartIndex <= oldEndIndex) {
+         for (let i = oldStartIndex; i <= oldEndIndex; i++) {
+             let child = oldChildren[i]
+             if (child !== undefined) { // 有可能是遍历到已经被使用过的虚拟节点，需要排除掉
+                 parent.removeChild(child.el)
+             }
+         }
+     }
+ }

// 更新属性，注意这里class与style无法处理表达式，因为从前面解析的时候就没处理，还是那句，重点不在完全实现，而是学习核心思路
function updateProperties (vnode, oldProps = {}) {
    const newProps = vnode.data || {}
    const el = vnode.el

+   // 1. 老的属性，新的没有，删除属性
+   // 前面提到过一次，以前vue1需要考虑重绘，现在新版浏览器已经会做合并，所以不用再去考虑使用documentFlagment来优化了
+   for (let key in oldProps) {
+       if (!newProps[key]) {
+           el.removeAttribute(key)
+       }
+   }

+   let newStyle = newProps.style || {}
+   let oldStyle = oldProps.style || {}
+   for (let key in oldStyle) { // 新老样式先进行比对，删除新vnode中没有的样式
+       if (!newStyle[key]) {
+           el.style[key] = ''
+       }
+   }

+   // 2. 新的属性，老的没有，直接用新的覆盖，不用考虑有没有
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
```

#### vue更新时引入diff算法
diff算法是在渲染更新时才需要使用的，前面实现时，_update使用了一个虚拟节点，所以现在要在实例上再挂一个`_vnode`，用于保存上一次的虚拟节点（`patch`需要老虚拟节点与新虚拟节点做对比）
```diff
// lifecycle.js
export function lifecycleMixin (Vue) {
    // 视图更新方法，用于渲染真实DOM
    Vue.prototype._update = function (vnode) {
        const vm = this

+       const preVnode = vm._vnode // 初始化时必然为undefind
+       vm._vnode = vnode
+
+       if (!preVnode) { // 初渲染
+           // 首次渲染，需要用虚拟节点，来更新真实的dom元素（vm._render()）
+           // 第一次渲染完毕后 拿到新的节点，下次再次渲染时替换上次渲染的结果
            vm.$el = patch(vm.$el, vnode) // 组件调用patch方法后会产生$el属性
+       } else { // 视图更新渲染
+           vm.$el = patch(preVnode, vnode)
+       }
    }
}
```
