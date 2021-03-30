## 合并策略与组件渲染原理
---
#### Vue.mixin实现
在vue中有一个静态方法：`Vue.mixin`，用于属性与生命周期的合并
vue3已经废弃，因为该方法存在一些问题：
+ 可能被开发者滥用（全局混入，导致变量冲突）
+ 来源不明确（某些方法与属性需要去到minxin中查找）

在Vue上新增静态方法，如之前一样，使用混入的方式
```diff
// index.js
+ import { initGlobalAPI } from './global-api/index.js'

+ initGlobalAPI(Vue)
```
```js
// global-api\index.js
import { mergeOptions } from "@/util.js"

export function initGlobalAPI (Vue) {
    Vue.options = {} // 用来存储全局的配置

    // Vue还有一些其他的静态方法诸如：filter directive component
    Vue.mixin = function (mixin) {
        this.options = mergeOptions(this.options, mixin)
        return this
    }
}
```
合并策略主要分为两个：属性合并与生命周期合并

#### 属性合并
属性合并主要实现思路是对象合并，规则如下（其实就是Object.assgin的规则）：
+ 如果父组件有子组件也有，应该用子组件替换父组件
+ 如果父组件有值，子组件没有，用父组件的
当然这里用父子组件描述其实也不合适，但没想到什么好的描述，其实就是一个先后顺序，看谁先往Vue上注入（可以简单理解为谁先执行`Vue.mixin`）
```js
// util.js
// 同nextTick，并没有如源码那样拆分出来，有兴趣的自行github撸源码

// 合并策略，属性采用对象合并（Object.assgin规则），生命周期则包装成数组，后面依次执行
export function mergeOptions (parent, child) {
    const options = {}
    // 如果父亲有儿子也有，应该用儿子替换父亲；如果父亲有值儿子没有，用父亲的
    // {a: 1} {a: 2} => {a: 2}
    // {a: 1} {b: 2} => {a:1, b: 2}

    // 使用for，主要考虑到深拷贝
    for (let key in parent) {
        mergeField(key)
    }

    for (let key in child) {
        if (!parent.hasOwnProperty(key)) { // 如果父组件也有该属性，合并过了，子组件无需再处理
            mergeField(key)
        }
    }

    // vue这种做法，老是在函数中写函数我也是醉了…
    function mergeField (key) {    
        // data属性的合并处理
        if (isObject(parent[key]) && isObject(child[key])) {
            options[key] = {...parent[key], ...child[key]}
        } else {
            if (child[key]) { // 如果儿子有值
                options[key] = child[key]
            } else {
                options[key] = parent[key]
            }
        }
    }

    return options
}
```

#### 生命周期的合并
生命周期合并，不同于属性，函数是没法合并的，需要依次执行，实现的思路是队列
但是`Vue`的生命周期方法有很多个，如果一直if...else if，那么将会很不恰当，解决的办法是使用策略模式
```js
// util.js

// 没全写，主要是实现合并原理
const LIFECYCLE_HOOKS = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted'
]

const strats = {}
LIFECYCLE_HOOKS.forEach(hook => {
    strats[hook] = mergeHook
})

// 钩子合并策略，数组形式
function mergeHook (parentVal, childVal) {
    if (childVal) {
        if (parentVal) {
            // 如果儿子有父亲也有
            return parentVal.concat(childVal)
        } else {
            // 如果儿子有父亲没有
            return [childVal]
        }
    } else {
        return parentVal // 儿子没有直接采用父亲
    }
}
```
```diff
// 同上面同一文件，个人笔记可以diff，简书不支持
// 合并策略，属性采用对象合并（Object.assgin规则），生命周期则包装成数组，后面依次执行
export function mergeOptions (parent, child) {
    // vue这种做法，老是在函数中写函数我也是醉了…
    function mergeField (key) {
        // 策略模式，生命周期合并处理
+       if (strats[key]) {
+           return options[key] = strats[key](parent[key], child[key]) // 这里相当于调用mergeHook，因为没完全实现（比如components等那些合并策略并没有实现）
+       }
    }

    return options
}
```
这里说一下为什么返回的一定为数组吧，如果只看上面局部代码可能理解不了
最初初始化时（也就是第一次），传入的`Vue.options = {}`，因此第一次传入的parentVal为`undefined`
而如果我们在Vue实例化时如果有传入生命周期，走进策略中的时候，childVal就会有值，因此第一次返回结果必为`return [childVal]`

![生命周期合并策略](https://upload-images.jianshu.io/upload_images/13936697-c0ee0254b4752dfa.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

lifecycle中新增`callHook`方法，用于调用（在合适的时机调用对应的生命周期函数）
```diff
// lifecycle.js
export function lifecycleMixin (Vue) {
    Vue.prototype._update = function (vnode) {
+       vm.$el = patch(vm.$el, vnode) // 这里之前实现写错了，写到$options.el去了，改回来
    }
}

// 调用合并的生命周期，依次执行
+ export function callHook (vm, hook) { // 发布模式
+   const handlers = vm.$options[hook]
+   if (handlers) {
+       handlers.forEach(handlers => handlers.call(vm)) // 这也就是为什么vue的什么周期不能用箭头函数，call将无效，this指向了window而不是vm
+   }
+ }
```
调用生命周期函数（仅作示例，一样不会写全）
```diff
+ import { mountComponent, callHook } from './lifecycle.js'
+ import { mergeOptions, nextTick } from '@/util'

// 通过原型混合的方式，往vue的原型添方法
export function initMixin (Vue) {
    Vue.prototype._init = function (options) { // options是用户传入的对象
        const vm = this
        // 实例上有个属性 $options ，表示的是用户传入的所有属性
+       // vm.$options = options
+       vm.$options = mergeOptions(vm.constructor.options, options)

+       callHook(this, 'beforeCreate')
        // 初始化状态
        initState(vm)
+       callHook(this, 'created')
    }

    Vue.prototype.$mount = function (el) {
+       vm.$el = el // 同上，之前写错了

        // code...

        mountComponent(vm, el) // 组件挂载
    }
}
```

#### 组件的合并
内部使用的`Vue.extend`，返回通过对象创建一个类，通过这个类取创建一个组件去使用
先查找自己身上是否存在，没有则查找父亲的`__proto__`，使用`Object.create`来继承（这里的父子不是父子组件，需要理解为全局注册的和局部注册的组件）
```diff
// global-api\index.js
export function initGlobalAPI (Vue) {
    Vue.options = {} // 用来存储全局的配置

    // filter directive component
    Vue.mixin = function (mixin) {
        this.options = mergeOptions(this.options, mixin)
        return this
    }

+   // 调用生成组件
+   Vue.options._base = Vue // 永远指向Vue的构造函数
+   Vue.options.components = {} // 用来存放组件的定义
+   Vue.component = function (id, definition) {
+       definition.name = definition.name || id // 组件名，如果定义中有name属性则使用name，否则以组件名命名
+       definition = this.options._base.extend(definition) // 通过对象产生一个构造函数
+       this.options.components[id] = definition
+   }

+   let cid = 0
+   // 子组件初始化时，会 new VueComponent(options)，产生一个子类Sub
+   Vue.extend = function (options) {
+       const Super = this // Vue构造函数，此时还未被实例化
+       const Sub = function VueComponent (options) {
+           this._init(options)
+       }

+       Sub.cid = cid++ // 防止组件时同一个构造函数产生的，因为不同组件可能命名却是一样，会导致createComponent中出问题
+       Sub.prototype = Object.create(Super.prototype) // 都是通过Vue来继承的
+       Sub.prototype.constructor = Sub // 常规操作，原型变更，将实例所指向的原函数也改掉，这样静态属性也会被同步过来
+       // 注意这一步不是在替换$options.component，而是在将Vue.component方法进行统一，都是使用的上面那个Vue.component = function (id, definition)函数
+       Sub.component = Super.component
+       // ...省略其余操作代码
+       Sub.options = mergeOptions(Super.options, options) // 将全局组件与该实例化的组件options合并（注意之前的实现，只会合并属性与生命周期）
+       return Sub // 这个构造函数是由对象（options）产生而来的
+   }
}
```
```diff
// util.js
const strats = {}
LIFECYCLE_HOOKS.forEach(hook => {
    strats[hook] = mergeHook
})

+ // 组件合并策略
+ strats.components = function (parentVal, childVal) {
+     const res = Object.create(parentVal)
+     if (childVal) {
+         for (let key in childVal) {
+             res[key] = childVal[key]
+         }
+     }
+     return res
+ }
```
![传入组件中的options与Sub构造函数](https://upload-images.jianshu.io/upload_images/13936697-ea24dba2fce7879c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

#### 组件的渲染原理
回顾之前的渲染流程：解析成ast语法树 -> 转变为可执行的render（generate方法） -> 创建出vnode
而现在的问题在于，创建出来的vnode是一个自定义标签节点，而不是真实Dom，所以应该生成vnode时，应该将真实的组件内容替换掉这个自定义节点（组件）
因此在createElement（创建虚拟节点）时，我们需要区分该节点是自定义组件节点，还是真实节点。Vue源码中是写了大量的真实节点标签，通过标签名来进行识别
```diff
// utils.js
+ function makeUp (str) {
+     const map = {}
+ 
+     str.split(',').forEach(tagName => {
+         map[tagName] = true
+     })
+ 
+     return tag => map[tag] || false
+ }
+ 
+ // 标签太多，随便写几个，源码里太多了。高阶函数，比起直接使用数组的include判断，用字典时间复杂度为O(1)
+ export const isReservedTag = makeUp('a,p,div,ul,li,span,input,button')
```
通过`isReservedTag`方法，就能将自定义节点（组件名）与真实节点区分出来，如果是组件，那么去调用`createComponent`方法来创建对应的vnode
创建组件vnode时，还需要给组件添加生命周期（并非beforeCreate等vue的生命周期），因为不同于vue，组件是没有`$el`的（这句话看不懂就想一下自己写组件也不会在里面传入el吧），所以需要手动挂载来触发后续的update
```diff
// vdom\index.js
- import { isObject } from "@/util.js"
+ import { isObject, isReservedTag } from "@/util.js"

// 创建 Dom虚拟节点（代码逻辑变更）
export function createdElement (vm, tag, data = {}, ...children) {
    // 需要对标签名做过滤，因为有可能标签名是一个自定义组件
+   if (isReservedTag(tag)) {
+       return vnode(vm, tag, data, data.key, children, undefined)
+   } else {
+       // 自定义组件
+       const Ctor = vm.$options.components[tag] // Ctor是个对象或者函数
+       // 核心：vue.extend，继承父组件，通过原型链向上查找，封装成函数
+       return createComponent(vm, tag, data, data.key, children, Ctor)
+   }
}

+ function createComponent (vm, tag, data, key, children, Ctor) {
+     if (isObject(Ctor)) { // 对象，是个子组件，也封装成函数，统一
+         Ctor = vm.$options._base.extend(Ctor)
+     }
+ 
+     // 给组件增加生命周期（源码中是抽离出去的，所以需要将vnode传进入，而不是直接使用Ctor）
+     data.hook = {
+         init (vnode) {
+             // 调用子组件的构造函数
+             const child = vnode.componentInstance = new vnode.componentOptions.Ctor({})
+             child.$mount() // 手动挂载 vnode.componentInstance.$el = 真实的元素
+         }
+     }
+ 
+     // 组件的虚拟节点拥有 hook 和当前组件的 componentOptions ，Ctor中存放了组件的构造函数
+     return vnode(vm, `vue-component-${Ctor.cid}-${tag}`, data, key, undefined, undefined, {Ctor})
+ }

function vnode (vm, tag, data, key, children, text, componentOptions) {
    return {
        vm,
        tag,
        children,
        data,
        key,
        text,
+       componentOptions
    }
}
```
有了组件的vnode后，在Vue初始化时（查看init.js逻辑），会调用`$mount`，而`$mount`中会挂载组件`mountComponent`,`mountComponent`中触发`vue._update`来更新视图，`vue._update`中会使用`patch`来生成真实节点，而上面也说过，组件是不会有`$el`的，所以直接通过vnode来创建真实节点即可，创建真实节点时，这里有点骚。正常人应该像前面一样通过标签名再来一次判断，但是这里是通过去获取是否有`vnode.data.hook`来判断，有则调用`init(vnode)`直接去去调用实例化方法
```diff
// vdom\patch.js
export function patch(oldVnode, vnode) {
+   // 组件没有oldVnode，直接创建元素
+   if (!oldVnode) {
+       return createdElm(vnode) // 根据虚拟节点创建元素
+   }

    // 之前的code...
}

+ // 创建节点真实Dom
+ function createComponent (vnode) {
+     let i = vnode.data
+     // 先将vnode.data赋值给i，然后将i.hook赋值给i，如果i存在再将i.init赋值给i，疯狂改变i的类型，虽然js中都属于Object，但真的好吗…
+     if ((i = i.hook) && (i = i.init)) {
+         i(vnode) // 调用组件的初始化方法
+     }
+ 
+     if (vnode.componentInstance) { // 如果虚拟节点上有组件的实例说明当前这个vnode是组件
+         return true
+     }
+ 
+     return false
+ }

function createdElm (vnode) { // 根据虚拟节点创建真实节点，不同于createElement
    let { vm, tag, data, key, children, text } = vnode    

    if (typeof tag === 'string') {
+       // 可能是组件，如果是组件，就直接创造出组件的真实节点
+       if (createComponent(vnode)) {
+           // 如果返回true，说明这个虚拟节点是组件
+           return vnode.componentInstance.$el
+       }

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
```