源码相关的文章确实不好写，一个是每个人基础功不一样，我觉得说的清楚的东西可能对到别人依旧含糊，一个是对一些逻辑的理解也未必就敢说百分百正确，最后是真想拆分一步步的关键代码都不好拆。如果有这种文章经验的作者欢迎交流

## 准备工作
自行实现的vue毕竟是阉割版的，所以这里下载`vue/cli`来进行router与后面的vuex开发。执行命令`npm i @vue/cli -D`进行安装（这里怎么安装都可以，具体看个人）
由于不是全局安装，所以使用vue命令会报错，需要自行配置环境变量，参考传送门：[非全局vue-cli](https://blog.csdn.net/xf_123456789/article/details/99682040)

安装完成，执行`vue create 你的项目工程名称`，一路想怎么选就看个人了，我选的自定义然后按照自己习惯配置。
去到工程目录，执行`npm run serve`启动服务

## vue-router两种模式简介
单页应用也叫spa应用，路径切换不刷新页面，但可以重新渲染组件
vue-router是一个构造函数，前端路由实现，有两种模式：hash模式与history模式
hash链接上会带有#号，但是兼容性好，不同路径可展示不同页面组件，基于`location.hash`
history与一般的链接无异，但链接是模拟出来的，并非真实链接，因此直接进入会404，需要后台配置（本地开发不需要考虑，因为使用了history-fallback插件），基于`window.history.pushState`

## 初始化结构目录
src目录下新建vue-router文件夹，创建`index.js`与`install.js`来替换node_modules中的vue-router
将`src/router/index.js`中引用的vue-router替换为自行创建的vue-router`import VueRouter from '@/vue-router'`

## vue.use
vue使用插件的方式是使用`vue.use`，`vue.use`会自动执行插件的install方法，这样做的好处是插件需要依赖于`vue`，但如果插件中指定了某个`vue`版本，而用户下载使用的版本与插件的版本不一致时，就会导致冲突。所以通过vue，将用户使用的vue传入组件中，就能保证用户使用的vue与插件使用的vue是完全一致的（意思就是你插件中直接使用`import Vue from 'vue'`的话，那么这个vue是不是就有可能跟用户使用的不一致了）

代码示例：
```js
Vue.use = function (plugin, options) {
    plugin.install(this, options)
}

Vue.use(VueRouter)
```

## VueRouter与install

```js
// vue-router/index.js
// 拿到的是变量_Vue，所以Vue.use时就可以拿到Vue
import { install, _Vue } from './install'

export default class VueRouter {
    constructor (options) {}
}

VueRouter.install = install
```
我们在任何组件中都可以通过`vue.router`来获取到router实例，其实现主要是靠mixin，向`beforeCreate`生命周期注入

我们知道初始化vue会产生两个实例，一个是`new Vue`，一个是实例化app的vue组件
![初始化vue](https://upload-images.jianshu.io/upload_images/13936697-71a70c06e0b03b2e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

而我们路由只会在实例化Vue时注入，子组件中（上图为app）中是不会有该router实例的
```js
new Vue({
    name: 'Root',
    router,
    render: h => h(App)
}).$mount('#app')
```
因此可以通过判断`$options`中是否有`router`来鉴别是否为`vue`实例，否则证明是子组件，子组件通过`$parent`来获取`router`实例
```js
// vue-router/install.js
// 需要将install方法单独的进行拆分
export let _Vue

export function install (Vue, options) {
    _Vue = Vue

    // 将当前的根实例提供的router属性共享给所有子组件
    Vue.mixin({
        beforeCreate () {
            // 获取到每个子组件的实例，给实例添加属性
            if (this.$options.router) {
                this._routerRoot = this
            } else {
                this._routerRoot = this.$parent && this.$parent._routerRoot
            }
        }
    })
}
```

## createRouteMap
vue-router需要生成一份配置表，用于匹配路径来决定使用什么组件，还可以支持动态加载路由`addRoute`
```js
// vue-router/index.js
+ import createMather from './createMather'

export default class VueRouter {
    constructor (options) {
        // 根据用户的配置生成一个映射表，跳转时，根据路径找到对应的组件来进行渲染
        // 创建匹配器后，核心的方法就是匹配
        // 但用户可能还会动态的添加路由（match/addRoutes）
        this.mather = createMather(options.routes || [])
    }
    // 路由初始化
    init (app) { // app就是根实例 new Vue

    }
}
```
```js
// vue-router/createMather.js
import createRouteMap from './create-route-map'

export default function createMather (routes) {
    const { pathMap } = createRouteMap(routes) // 根据用户的路由配置创建一个映射表

    // 动态添加路由权限
    function addRoutes (routes) {
        createRouteMap(routes, pathMap) // 实现动态路由
    }

    // 根据提供的路径匹配路由
    function match (path) {
        // 先占个坑
    }

    return {
        addRoutes,
        match
    }
}
```
生成路由映射表，根据用户传入的routes生成一份路由相对应的映射表，后续通过该映射表就可以快速知道使用的参数插件等等
```js
// vue-router/create-route-map.js
// 生成路由映射表，支持动态加载路由
export default function createRouteMap (routes, oldPathMap) {
    // 一个参数是初始化，两个参数是动态添加路由
    const pathMap = oldPathMap || {}

    routes.forEach(route => {
        addRouteRecord(route, pathMap, null)
    })

    return pathMap
}

// 填充路由，生成路由对象
function addRouteRecord (route, pathMap, parent) { // pathMap = {路径: 记录}
    // 要判断儿子的路径不是以 / 开头的，否则不拼接父路径
    const path = route.path.startsWith('/') ? route.path : parent ? parent.path + '/' + route.path : route.path
    const record = {
        path,
        parent, // 父记录
        component: route.component,
        name: route.name,
        props: route.props,
        params: route.params || {},
        meta: route.meta
    }

    // 判断是否存在路由记录，没有则添加
    if (!pathMap[path]) {
        pathMap[path] = record
    }

    if (route.children) {
        // 递归，没有孩子就停止遍历
        route.children.forEach(childRoute => {
            addRouteRecord(childRoute, pathMap, record)
        })
    }
}
```

## 不同模式处理，hash模式实现
前面说了`router`有两种模式，一种时hash，另一种时history，hash与history路径变化是不一致的。所以需要分开处理，而两者又都有一样的部分操作，所以可以通过三个类来进行不同处理
`History`主要负责跳转，渲染等，因为这些事情不管使用哪一种模式都是一致的，`HashHistory`和`H5History`都继承于该类
```js
// history/base.js
export default class History {
    constructor (router) {
        this.router = router
    }
    // 根据路径进行组件渲染，数据变化更新视图
    transitionTo (location, onComplete) { // 默认会先执行一次
        onComplete && onComplete() // onComplete调用hash值变化会再次调用transitionTo
    }
}
```

```js
// history/hash.js
import History from './base'

// 判断链接是否带有hash，没有则添加#/，否则不添加
function ensureSlash () {
    if (window.location.hash) { return }
    window.location.hash = '/' // url如果不带hash，自动添加 #/
}

function getHash () {
    return window.location.hash.slice(1)
}

export default class HashHistory extends History {
    constructor (router) {
        super(router)

        // 默认hash模式需要加 #/
        ensureSlash()
    }
    setupListener () {
        // 好陌生，查了一下事件居然有这么多：https://www.runoob.com/jsref/dom-obj-event.html
        // hashchange性能不如popstate，popstate用于监听浏览器历史记录变化，hash变化也会触发popstate
        window.addEventListener('popstate', () => {
            // 根据当前hash值，去匹配对应的组件
            this.transitionTo(getHash())
        })
    }
    getCurrentLocation () {
        return getHash()
    }
}
```

```js
// history/history.js
import History from './base'

// 没按照源码 HTML5History，指的是浏览器跳转
export default class BrowserHistory extends History {
    constructor (router) {
        console.log('history mode')
        super(router)
    }
    getCurrentLocation () {
        return window.location.pathname
    }
}
```
有了上面不同的实例后，就能在初始化时实例化不同历史实例
```diff
import { install, _Vue } from './install'
import createMather from './createMather'
import HashHistory from './history/hash'
import BrowserHistory from './history/history'

export default class VueRouter {
    constructor (options) {
+       // 根据当前的mode，创建不同的history管理策略
+       switch (options.mode) {
+           case 'hash':
+               this.history = new HashHistory(this)
+               break
+           case 'history':
+               this.history = new BrowserHistory(this)
+               break
+       }
    }
    // 路由初始化
    init (app) { // app就是根实例 new Vue
+       // 初始化后，需要先根据路径做一次匹配，后续根据hash值变化再次匹配
+       const history = this.history // history的实例
+       const setupListener = () => {
+           history.setupListener() // 挂载监听，监听hash值变化
+       }
+       // 跳转到哪里，getCurrentLocation为私有，因为 hash 与 history 处理不一致
+       history.transitionTo(history.getCurrentLocation(), setupListener)
    }
}

VueRouter.install = install
```

## 根据跳转路径，匹配及产生对应路由记录
目前跳转时，history并不知道发生了什么事，也不知道应该使用什么记录。因此需要根据跳转路径获取对应的路由记录。路由记录需要从子页面到父页面都产生出来，需要使用`matcher`进行匹配，产生对应的所有路由记录

```diff
// history/base.js
// 根据路径，返回该路径所需的所有记录
+ export function createRoute (record, location) {
+     const res = []
+ 
+     if (record) {
+         while (record) { // 二级菜单及N级菜单，将对应的菜单一个个往栈中加
+             res.unshift(record)
+             record = record.parent
+         }
+     }
+ 
+     return {
+         ...location,
+         matched: res
+     }
+ }

export default class History {
    constructor (router) {
        this.router = router
+       // 最终核心需要将current属性变化成响应式的，后续current变化会更新视图
+       this.current = createRoute(null, {
+           path: '/'
+       })
    }
    // 根据路径进行组件渲染，数据变化更新视图
    transitionTo (location, onComplete) { // 默认会先执行一次
        // 根据跳转的路径，获取匹配的记录
        const route = this.router.match(location)
+       this.current = route
        // 由于由响应式变换的是_route（install中进行的响应式定义），而更改的是this.current，无法触发响应式
        
+       /** 
+        * vueRoute用于提供给用户直接使用，vueRoute中又需要对历史记录进行操作
+        * 跳转的时候又是由历史记录所触发，需要通知变更vue._route，而现在变更的是历史记录中的current
+        * 需要将自身变更后匹配到的路由返回给vueRouter，这里也不能直接使用 install 导出的 _vue
+        * 是因为考虑到有可能实例化了多个Vue，这个时候的_Vue是最后实例化的Vue，并非对应vueRouter所使用的Vue实例
+        * 通过listen去执行vueRouter绑定的函数，vueRouter中有当前Vue实例，就能将当前匹配到的路由赋值给Vue._route，这样就能触发响应式变化
+        */
+       this.cb && this.cb(route) // 第一次cb不存在，还未进行绑定回调
        onComplete && onComplete() // cb调用hash值变化会再次调用transitionTo
    }
+   listen (cb) {
+       this.cb = cb
+   }
}
```
match填坑
```diff
+ import { createRoute } from './history/base.js'

// 匹配器
export default function createMather (routes) {
    // 根据提供的路径匹配路由
+   function match (path) {
+       const record = pathMap[path]
+
+       return createRoute(record, {
+           path
+       })
    }
}
```

## 定义响应式及挂载属性，注册组件
history中已经可以根据路由变化产生对应的路由记录（`createRoute`），但是用户操作的是vue.$route并不是响应式的。总不能用户路由跳转之后还得调一个方法才能产生页面渲染，数据变了则视图更新，需要vue的响应式，但插件中vue还未被实例化，因此不能直接使用`$set`来进行。前面实现的`vue`核心中，有一个`defineReactive`方法用于定义响应式，因此插件中是直接通过使用`Vue.util.defineReactive`来定义成响应式的
```diff
export function install (Vue, options) {
+   // 如果已经注册过router并且是同一个Vue实例，直接返回
+   if (install.installed && _Vue === Vue) { return }
+   install.installed = true
+   _Vue = Vue

    // 将当前的根实例提供的router属性共享给所有子组件
    Vue.mixin({
        beforeCreate () {
            // 获取到每个子组件的实例，给实例添加属性
            if (this.$options.router) {
                // code...

+               // 使用 Vue 的工具类方法定义成响应式的，真实项目需要使用 $set，这里没法用是因为Vue还未实例化
+               Vue.util.defineReactive(this, '_route', this._router.history.current)
            } else {
                // code...
            }
        }
    })
```
我们需要使用`vue-router`时，是通过`vue.$route`和`vue.$router`来访问路由对象及获取当前路由对应属性的，插件中是将这两个属性挂载原型上并进行劫持
vue-router中还提供两个组件，用于跳转与渲染视图：`RouteLink`和`RouteView`
```diff
+ import RouteLink from './components/link'
+ import RouteView from './components/view'

export function install (Vue, options) {
    // code...

+   // 让用户可以直接使用 vue.$route 和 $router
+   Object.defineProperty(Vue.prototype, '$route', {
+       get () {
+           return this._routerRoot._route // current对象里面的所有属性
+       }
+   })
+
+   Object.defineProperty(Vue.prototype, '$router', {
+       get () {
+           return this._routerRoot._router // addRoute match 方法等
+       }
+   })
+
+   // 注册所需组件
+   Vue.component('router-link', RouteLink)
+   Vue.component('router-view', RouteView)
}
```
创建这两个组件
```js
// components/link.js
export default {
    name: 'router-link',
    props: {
        to: {
            type: String,
            required: true
        },
        tag: {
            type: String,
            default: 'a'
        }
    },
    render (h) {
        // jsx，但不同于react的jsx需要写死标签，vue中可以写变量标签
        const tag = this.tag
        return <tag onClick={() => {
            this.$router.push(this.to)
        }}>{this.$slots.default}</tag>

        // 等价的render函数，写起来太痛苦
        // return h(this.tag, {}, this.$slots.default)
    }
}

// components/view.js
export default {
    name: 'router-view',
    render (h) {
        return h()
    }
}
```

## RouteView实现
routerView负责的工作，就是通过当前路径，渲染对应的组件
routerView的渲染方式为functional，无状态 (没有响应式数据)，也没有实例 (没有 this 上下文)，传送门：(函数式组件)[https://cn.vuejs.org/v2/guide/render-function.html#%E5%87%BD%E6%95%B0%E5%BC%8F%E7%BB%84%E4%BB%B6]

$vnode 与 _vnode 的区别
$vnode 表示的是组件本身是长啥样的
_vnode 表示的是组件真实渲染出来的结果是啥样的
```js
<my></my> // $vnode => {type: {name: 'vue-component-id-my'}, data: {...}, children: undefind}
          // _vnode => {type: 'div', dataL {...} children: undefined, el: div}
```
假设页面中有两个router-view，一个为`App.vue`中写的`router-view`，一个为`about`页面中的`router-view`，当前路径为`/about/aa`，简单的描述这一整个过程：
此时匹配出的matched：[/about, /about/aa]
此时的Vue文件中调用router-view的顺序：[App.vue/router-view，About.vue/router-view]

app.vue => routerView => routerViewComponent.data.routerView = true => parent.\$vnode.data.routerView为undefined，不进入depth++ => 取出record为 /about => 执行渲染函数，出入的data为标记过routerView（其实就是原本的data加上一个routerView标识）=> 来到about.vue页面，发现里面写了一个routerView => routerViewComponent.data.routerView = true => parent.$vnode.data.routerView(就是app.vue页面的router-view组件，上一个步骤已经挂上一个routerView标识） => 进入depth++ => 取出匹配结果为（/about/aa）=> 执行渲染 => 然后就是各种实例化结束的生命周期等

```js
// component/view.js
export default {
    functional: true, // 函数式组件，可以节省性能，但没有实例与没有响应式变化
    name: 'RouterView',
    render (h, { data, parent }) {
        const route = parent.$route // 会做依赖收集了
        let depth = 0
        const records = route.matched
        data.routerView = true // 渲染router-view时标记它是一个router-view，这样如果子组件中继续调用router-view，不至于会死循环

        // 二级节点，看之前渲染过几个router-view
        while (parent) {
            // 由于 $vnode 与 _vnode 命名太相像，vue3中将 _vnode 命名未 subtree
            if (parent.$vnode && parent.$vnode.data.routerView) {
                depth++
            }

            parent = parent.$parent
        }

        const record = records[depth]

        if (!record) { return h() } // 匹配不到，返回一个空白节点
        return h(record.component, data) // 渲染一个组件，函数式写法为：h(component)，这里就是去渲染组件
    }
}
```

## history实现
history观测的是浏览器的前进后退，不同于hash，跳转的时候`window.history.pushState`并不会触发`popstate`（因为该api是历史管理，并不会观测路径变化），所以需要手动执行跳转，再去调用`pushState`
```js
import History from './base'

export default class BrowserHistory extends History {
    constructor (router) {
        console.log('history mode')
        super(router)
    }

    getCurrentLocation () {
        return window.location.pathname
    }

    setupListener () {
        window.addEventListener('popstate', () => {
            // 监听路径变化（浏览器的前进后退）进行跳转
            this.transitionTo(this.getCurrentLocation())
        })
    }

    push (location) {
        this.transitionTo(location, () => {
            // 采用 H5 的 API 跳转，这里的切换不会触发 popstate，所以不能像hash一样，需要放到回调中来处理
            window.history.pushState({}, null, location)
        })
    }
}
```

## hook实现
导航具体的触发流程，建议阅读官方文档，传送门: [完整的导航解析流程](https://router.vuejs.org/zh/guide/advanced/navigation-guards.html#%E5%AE%8C%E6%95%B4%E7%9A%84%E5%AF%BC%E8%88%AA%E8%A7%A3%E6%9E%90%E6%B5%81%E7%A8%8B)，根据面试造火箭特性，父子组件生命周期渲染流程经常提问，或许以后会出现导航解析流程
vueRouter有一个方法，beforeEach（全局前置守卫），实际项目中被用来做一些权限判断（拦截器），简单的理解，就是类似于Koa的中间件（比如本人前面Koa的文章使用koa-jwt对用户登录权限判断）
多次使用依次执行，实质就是个迭代器
```js
router.beforeEach((to, from, next) => {
    setTimeout(() => {
        console.log(1)
        next()
    }, 1000)
})

router.beforeEach((to, from, next) => {
    setTimeout(() => {
        next()
    }, 1000)
})
```
```diff
+ function runQueue (queue, interator, cb) {
+     function next (index) {
+         if (index >= queue.length) {
+             return cb() // 一个钩子都没有，或者钩子全部执行完毕，直接调用cb完成渲染即可
+         } else {
+             const hook = queue[index]
+             interator(hook, () => next(index + 1))
+         }
+     }
+ 
+     next(0)
+ }

export default class History {
    // 根据路径进行组件渲染，数据变化更新视图
    transitionTo (location, onComplete) { // 默认会先执行一次
        // 根据跳转的路径，获取匹配的记录
        const route = this.router.match(location)

+       const queue = [].concat(this.router.beforeEachHooks)

+       // 迭代器
+       const interator = (hook, cb) => { // 这里如果用function来声明，this则为undefined，因为构建后是严格模式
+           hook(route, this.current, cb) // to, from, next
+       }

+       runQueue(queue, interator, () => {
            this.current = route
            // 由于由响应式变换的是_route（install中进行的响应式定义），而更改的是this.current，无法触发响应式
            // vueRoute用于提供给用户直接使用，vueRoute中又需要对历史记录进行操作
            // 跳转的时候又是由历史记录所触发，需要通知变更vue._route，而现在变更的是历史记录中的current
            // 需要将自身变更后匹配到的路由返回给vueRouter，这里不能直接使用 install导出的_vue
            // 是因为考虑到有可能实例化了多个Vue，这个时候的_Vue是最后实例化的Vue，并非对应vueRouter所使用的Vue实例
            // 通过listen去执行vueRouter绑定的函数，vueRouter中有当前Vue实例，就能将当前匹配到的路由赋值给Vue._route，这样就能触发响应式变化

            this.cb && this.cb(route) // 第一次cb不存在，还未进行绑定回调，cb调用触发视图更新
            onComplete && onComplete() // cb调用hash值变化会再次调用transitionTo
+       })
    }
    listen (cb) {
        this.cb = cb
    }
}
```