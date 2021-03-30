## 准备工作
如果前面有自行实现过vue-router，那这里就没有工作了，否则移步[手写Vue2核心（七）：vue-router实现](https://www.jianshu.com/p/8d6163823b52)

## VueRouter与install
vuex的引用比vue-router拆分得细一点，但实现原理等同于vue-router，一些重复的实现原理就不过多赘述了，直接上代码
```js
// vuex/index.js
import { Store, install } from './store'

// 两种导出方式，方便用户可以通过 import {Store}，或者通过 import Vuex，通过 Vuex.Store 和 Vuex.install
export {
    Store,
    install
}

export default {
    Store,
    install
}
```

```js
// vuex/store.js
import { applyMixin } from './mixin'

export let Vue // 此 Vue 是用户注册插件时传入的 Vue 构造函数
export class Store {
    constructor (options) {
        console.log(options)
    }
}

// 搞得太花里胡哨，但最终还是在 vuex/index.js 中将 install和store 导出，所以这里怎么华丽花哨并不重要，能导出install进行mixin注入即可
// 实现原理依旧等同于 vue-router
export const install = (_Vue) => {
    Vue = _Vue
    applyMixin(Vue)
}
```

```js
// vuex/minxin.js，等同于vue-router的install.js
function vueInit () {
    if (this.$options.store) {
        this.$store = this.$options.store // 给根属性增加 $store 属性
    } else if (this.$parent && this.$parent.$store) {
        this.$store = this.$parent.$store
    }
}

export const applyMixin = (Vue) => {
    Vue.mixin({
        beforeCreate: vueInit // 继续拆，原理还是一样，通过查找父组件的$store属性来判断获取实例
    })
}
```

## 响应式数据，实现state与getters
`vuex`的`state`，相当于`data`，`getters`相当于`computed`，因此`getters`是具备缓存，且不同于`computed`，是不允许设置值的（vuex中提供的commit和dipath都不会直接操作getters）

`vuex`是衍生于`Vue`的，只能供`Vue`使用，其主要原因在于实现中，是通过创建一个新的`Vue`实例，来挂载到`Store._vm`上，这样做的原因是`Store`是具备响应式数据变化的，当数据变化时，会触发视图渲染

页面中对`Store`取值时，会触发`Vue`的依赖收集，但是`state`本身是没必要去挂载到`Vue._vm`上的（不会变为实例属性）。`Vue`中提供了`$`符，来设置这些属性不会被`Vue`代理。文档传送门：[vue.data](https://cn.vuejs.org/v2/api/#data)

`getters`是以函数的形式来定义取值的方法，具备缓存功能。而由于所有属性均为函数，所以需要执行才能取值，并且不能默认帮用户全部执行，否则取值就会各种不正确，而是应该在使用时再进行取值

通过`Object.defineProperty`来对`getters`进行劫持，当访问属性时，去调用其对应的函数执行。而`getters`是具备缓存功能的，所以需要将所有`getters`中定义的属性都放到计算属性中

```diff
// vuex/store.js
+ const forEachValue = (obj, cb) => {
+     Object.keys(obj).forEach(key => cb(obj[key], key))
+ }

export let Vue // 此 Vue 是用户注册插件时传入的 Vue 构造函数
export class Store {
    constructor (options) {
+       const computed = {}

+       // getters实现
+       this.getters = {}
+       forEachValue(options.getters, (value, key) => {
+           // 通过计算属性替换直接执行函数获取值的形式，计算属性具备缓存
+           computed[key] = () => value.call(this, this.state)

+           // value 是函数，getter 获取的是属性值，所以在获取的时候再去执行函数获取其对应的值
+           // 而且这样操作是每次取值时都能取到最新结果，否则直接执行函数取值后面就没法变更了
+           Object.defineProperty(this.getters, key, {
+               // 这里要用箭头函数保证this指向，否则里面就不能用 call(this)
+               get: () => {
+                   // 用call是为了防止用户在 getters 中使用了this，当然正常都是通过传入的state state.xxx，而不是 this.state.xxx
+                   // return value.call(this, this.state) // 每次取值都会重新执行用户方法，性能差，所以需要替换成计算属性取值
+                   return this._vm[key]
+               }
+           })
+       })

+       // 用户肯定是先使用 Vue.use，再进行 new Vue.Store({...})，所以这里的 Vue 已经是可以拿到构造函数的了
+       // 必须放到f forEachValue 后面，确保 computed 已经有值
+       this._vm = new Vue({
+           data: {
+               // Vue中不会对 $开头的属性进行代理操作（不会挂到_vm上进行代理）
+               // 但是其属性依旧会被代理到（页面获取时依然会被收集依赖），因为我们不会直接操作state，而是操作state.xxx，性能优化
+               $$state: options.state
+           },
+           computed
+       })
+   }
+   get state () { // 属性访问器
+       return this._vm._data.$$state
+   }
}
```

## 实现commit与dispatch
简单的实现，没啥好说的，唯一需要讲一下的是这里类的箭头函数，因为我们使用`commit`或`dispatch`时，是可以通过解构赋值的方式来调用函数的，但这样取值会导致this指向当前执行上下文
而ES7中的箭头函数是通过词法解析来决定this指向的，所以解构赋值取得的this会依旧指向`Store`

`mutations`与`dispatch`实现：
```diff
export class Store {
    constructor (options) {
        // code...

+       // mutations实现
+       this.mutations = {}
+       this.actions = {}
+
+       forEachValue(options.mutations, (fn, key) => {
+           this.mutations[key] = payload => fn.call(this, this.state, payload)
+       })
+
+       forEachValue(options.actions, (fn, key) => {
+           this.actions[key] = payload => fn.call(this, this, payload)
+       })
    }
    get state () { // 属性访问器
        return this._vm._data.$$state
    }
+   commit = (type, payload) => { // ES7语法，类的箭头函数，表示this永远指向store实例
+       this.mutations[type](payload)
+   }
+   dispatch = (type, payload) => {
+       this.actions[type](payload)
+   }
}
```

ES7类的箭头函数示例：
```js
// ES7 类的箭头函数编译结果示例
window.name = 'window'

function Store () {
    this.name = 'Store'
    
    // 注释掉下面四行，则commit方法中的this会指向window
    let { commit } = this
    this.commit = () => { // 获取时，实例上的属性优先于原型上的
        commit.call(this) // 通过call，将commit执行时this指向Store实例
    }
}

Store.prototype.commit = function () {
    console.log(this.name)
}

let {commit} = new Store() // 这里解构取得的commit，this指向的window

// 上面解构赋值后相当于这样，所以调用的时候this指向其调用的上下文环境，所以为window
// let commit = Store.prototype.commit
commit() // 实例上也有一个commit，commit通过箭头函数绑定了this指向
```

写到这里，一个简易版的vuex就实现了，但vuex里有一个东西叫模块`modules`，这东西的实现，导致上面这个简易版的`vuex`需要完全重写（只是重写`Store`）
但是上面的代码是很好理解的，所以分开来说，下面开始真正实现官方`vuex`

## vuex中模块的用法
modules，模块化管理，具备命名空间进行数据隔离。通过使用`namespaced`进行隔离，没有指定该属性中mutations和actions会影响全局
而对到state，会将模块名作为键，将其`state`作为值，添加到全局上
具体直接看文档吧，说的很清楚了。官方文档传送门：[modules](https://vuex.vuejs.org/zh/guide/modules.html#%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4)
```js
export default new Vuex.Store({
    state: { // data
        name: 'state',
        age: 10
    },
    getters: { // computed
        gettersAge (state) {
            return state.age + 20
        }
    },
    mutations: { // 同步变更
        changeAge (state, payload) {
            state.age = state.age + payload
        }
    },
    actions: {
        changeAge ({ commit }, payload) {
            setTimeout(() => {
                commit('changeAge', payload)
            })
        }
    },
    modules: {
        a: {
            state: {
                name: 'modules-a',
                age: 10
            },
            getters: {
                getName (staste) {
                    return staste.name
                }
            },
            mutations: { // 同步变更
                changeAge (state, payload) {
                    state.age = state.age + payload
                }
            },
            modules: {
                c: {
                    namespaced: true, // 有命名空间
                    state: {
                        name: 'modules-a-c',
                        age: 40
                    }
                }
            }
        },
        b: { // 没有命名空间，则changeAge方法也会影响到该模块中的state属性值
            namespaced: true, // 有命名空间
            state: {
                name: 'modules-b',
                age: 20
            },
            mutations: { // 同步变更
                changeAge (state, payload) {
                    state.age = state.age + payload
                }
            }
        }
    }
})
```

## vuex中的模块收集
其实就是转换成一个树形结构来进行管理，采用递归的方式，将用户传入的store参数转换为树形结构。每个模块都被重新包装成一个`module`类
```js
// module/module.js
export default class Module {
    constructor (rawModule) {
        this._raw = rawModule
        this._children = {}
        this.state = rawModule.state
    }
    getChild (key) { // 获取子节点中的某一个
        return this._children[key]
    }
    addChild (key, module) { // 添加子节点
        this._children[key] = module
    }
}
```
```js
// module/module-collection.js
import { forEachValue } from '../util'
import Module from './module'

// 将传入的store转成树型结构 _row为该模块键值，_children为该模块modules中的键值（也转为树形结构），_state为该模块中写的state，深度优先
export default class ModuleCollection {
    constructor (options) { // 遍历用户的属性对数据进行格式化操作
        this.root = null
        this.register([], options)
        console.log(this.root)
    }
    register (path, rootModule) {
        const newModule = new Module(rootModule)

        if (path.length === 0) { // 初始化
            this.root = newModule
        } else {
            // 将当前模块定义在父亲身上
            const parent = path.slice(0, -1).reduce((memo, current) => {
                return memo.getChild(current)
            }, this.root)

            parent.addChild(path[path.length - 1], newModule)
        }

        // 如果还有modules就继续递归
        if (rootModule.modules) {
            forEachValue(rootModule.modules, (module, moduleName) => {
                this.register(path.concat(moduleName), module)
            })
        }
    }
}
```
![store构造成树形结构](https://upload-images.jianshu.io/upload_images/13936697-eb68f62d1500be13.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## vuex中的模块实现
这里实现的时没有namespace的逻辑，具体是将模块中的参与合并到全局上，对于用户传入配置分别进行以下处理：
+ **state**: 将模块中的state合并到全局，通过模块名称作为全局state的键，并设置成响应式
+ **getter**s：将模块中的getters合并到全局，同名的属性，后面的会覆盖前面的，并设置到自行创建的vue.computed上、
+ **mutations和actions**：实现逻辑一致，就是将其放入栈中，等调用的时候依次调用
所以逻辑总结起来就两步：将用户传入的配置合并到全局，将数据设置为响应式

```js
// store.js
/**
 * @param {Object} store store实例
 * @param {Array} path 模块父子关系，初始为空
 * @param {Object} module 转化为树结构后的模块
 * @param {*} rootState 全局store的state
 * @descript 将模块中的mutations和actions都合并到全局上，通过栈的方式依次push，调用的时候依次执行
 * 将模块中的 state 和 getters 也合并到全局上，state会将模块名设置为全局的键，而getters则是没用namespace的话会合并到全局，后面同名的会覆盖前面的
 */
const installMudole = (store, path, module, rootState) => {
    // store => [], store.modules => ['a'], store.modules.modules => ['a', 'c']
    if (path.length > 0) { // 是子模块
        const parent = path.slice(0, -1).reduce((memo, current) => {
            return memo[current]
        }, rootState)

        // vue-router是使用Vue.util.defineReactive，所以这里写成Vue.util.defineReactive(parent, path[path.length - 1], module.state)也可以
        // 因为目标就是要把模块定义成响应式的，源码路径：/src/core/util
        // 这里不用set也能实现响应式，因为下面会把 state 设置到创建的 Vue 上来实现响应式，不过源码中就是用的set
        Vue.set(parent, path[path.length - 1], module.state)
        // parent[path[path.length - 1]] = module.state // 但是这样操作子模块不是响应式的
    }

    module.forEachMutation((mutation, key) => {
        store.mutations[key] = store.mutations[key] || []
        store.mutations[key].push(payload => mutation.call(store, module.state, payload))
    })
    module.forEachAction((action, key) => {
        store.actions[key] = store.actions[key] || []
        store.actions[key].push(payload => action.call(store, store, payload))
    })
    module.forEachChildren((childModule, key) => {
        installMudole(store, path.concat(key), childModule, rootState) // childModule.state
    })
    // 没用namespace，则所有模块的getters默认都会合并到一个对象里，都是直接getters.xxx即可，而不用getters.a.xxx
    module.forEachGetters((getterFn, key) => {
        store.wrapGetters[key] = () => getterFn.call(store, module.state)
    })
}

export class Store {
    constructor (options) {
        // 格式化用户传入的配置，格式化成树结构
        this._modules = new ModuleCollection(options)

        this.mutations = {} // 将用户所有模块的mutation都放到这个对象中
        this.actions = {} // 将用户所有模块的action都放到这个对象中
        this.getters = {}
        this.wrapGetters = {} // 临时变量，存储getters
        const state = options.state // 用户传入的全局state，还是非响应式的

        // 将所有模块中的mutations和actions合并到全局上，合并state和getters到全局上
        installMudole(this, [], this._modules.root, state)
        // 初始化与重置（源码中因为需要对热更新进行判断，热更新需要重置，但这里就是单纯的初始化）
        // 主要干两件事：将state设置成响应式挂到store._vm上（通过new Vue），将getters挂到computed上
        resetStoreVM(this, state)
    }
    get state () { // 属性访问器
        return this._vm._data.$$state
    }
}

function resetStoreVM (store, state) {
    const computed = {}

    forEachValue(store.wrapGetters, (fn, key) => {
        computed[key] = fn // 将是所有的属性放到computed中
        Object.defineProperty(store.getters, key, {
            get: () => store._vm[key]
        })
    })

    // 用户肯定是先使用 Vue.use，再进行 new Vue.Store({...})，所以这里的 Vue 已经是可以拿到构造函数的了
    // 必须放到f forEachValue 后面，确保 computed 已经有值
    store._vm = new Vue({
        data: {
            // Vue中不会对 $开头的属性进行代理操作（不会挂到_vm上进行代理）
            // 但是其属性依旧会被代理到（页面获取时依然会被收集依赖），因为我们不会直接操作state，而是操作state.xxx，性能优化
            $$state: state
        },
        computed
    })
}
```

![parent[path[path.length - 1]] = module.state处理，未定义成响应式](https://upload-images.jianshu.io/upload_images/13936697-c417c69798c624c9.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 实现commit和dispatch
记录了namespace后，在获取与调用对应方法时，则是通过路径名+方法的方式来调用。比如`commit('a/getterAge', 20)`，`dispatch`也是如此。因此在初始化`installMudole`时，需要将`mutations`/`actions`/`getters`都加上对应路径。当然这里的实现是不健全的，vuex中如果存在namespace，则dispatch里使用commit，是不需要带上相对路径的，会去找自己的`mutations`中对应的方法，这里并未实现

```diff
// store.js
const installMudole = (store, path, module, rootState) => {
+   const namespace = store._modules.getNamespace(path)
    // code...

    module.forEachMutation((mutation, key) => {
+       store.mutations[namespace + key] = store.mutations[namespace + key] || []
+       store.mutations[namespace + key].push(payload => mutation.call(store, module.state, payload))
    })
    module.forEachAction((action, key) => {
+       store.actions[namespace + key] = store.actions[namespace + key] || []
+       store.actions[namespace + key].push(payload => action.call(store, store, payload))
    })

    // 没用namespace，则所有模块的getters默认都会合并到一个对象里，都是直接getters.xxx即可，而不用getters[a/xxx]
    module.forEachGetters((getterFn, key) => {
+       store.wrapGetters[namespace + key] = () => getterFn.call(store, module.state)
    })
}

export class Store {
+   commit = (type, payload) => { // ES7语法，类的箭头函数，表示this永远指向store实例
+       if (this.mutations[type]) {
+           this.mutations[type].forEach(fn => fn(payload)) // 不同于之前，现在的mutations已经是个包含模块中mutations的数组
+       }
+   }
+   dispatch = (type, payload) => {
+       if (this.actions[type]) {
+           this.actions[type].forEach(fn => fn(payload))
+       }
+   }
}
```
module中添加获取命名空间，构建成树结果时可进行命名空间判断，是否需要添加成`a/method`的形式，否则调用路径依旧为全局直接调方法名的方式
```diff
// module/module.js
export default class Module {
+   get namespaced () {
+       return !!this._raw.namespaced
+   }
}

// module/module-collection.js
export default class ModuleCollection {
+   getNamespace (path) {
+       let module = this.root
+       return path.reduce((namespaced, key) => {
+           module = module.getChild(key)
+           // 如果父模块没有namespaced，子模块有，那么调用的时候就只需要写子模块，比如 c/ 否则就是a/c/
+           return namespaced + (module.namespaced ? key + '/' : '')
+       }, '')
+   }
}
```

## 插件实现
这里不是在实现`vuex`，而是在实现自己开发一个`vuex`插件，因为不会实现plugin，所以需要自行切换成原生`vuex`

或许大多数人都不知道`vuex`插件，官网高阶中有写，传送门：[vuex插件](https://vuex.vuejs.org/zh/guide/plugins.html)

面试题：如何实现vuex持久化缓存？
+ `vuex`无法实现持久化缓存，页面刷新的时候就会清除已经保存的数据。而有一个插件就是专门用于解决`vuex`持久化问题的：`vuex-persist`
那为什么有`localstorage`，还需要借助`vuex-persist`呢？
+ 因为`localstorage`数据变了页面数据也不会自动刷新，并非响应式的

插件接收一个数组，数组每一项均为函数，如果有多个插件，自上而下执行
官方提供了一个开发使用的插件`logger`，当然因为基本都会安装`vue-devtools`，所以并不会用到

vuex主要提供了两个方法来让用户自定义插件，分别是`subscribe`和`replaceState`，`subscribe`用于订阅触发`commit`事件，`replaceState`用于初始化时替换页面数据
支持自定义模式，这里`replaceState`只实现storage

插件的实现思路比较简单，就是发布订阅。但是有一个问题，就是`installMudole`中，之前的实现是通过用户定义的`state`（挂载store._vm._data.$$state上），初始化模块时，会为commit注册事件
而`replaceState`的实现，更改的是`store`上的`state`，导致视图渲染无效。因此需要在`commit`时重新去`store`上获取对应的值

```diff
+ // 最开始定义的时候，用的是用户传入的 state，但是一旦执行了replaceState，则 $$state 被替换
+ // Vue.set(parent, path[path.length - 1], module.state) 用的是最初传入定义成响应式的state（也就是rootState）,而replaceState设置的是store的state
+ // 一个是 module的state，一个是变更的store的state，就会导致commit时数据取值不正确（一直是旧数据），所以需要去store上重新获取
+ const getState = (store, path) => { // store.state获取的是最新状态
+     return path.reduce((rootState, current) => {
+         return rootState[current]
+     }, store.state)
+ }

const installMudole = (store, path, module, rootState) => {
    // code...

    module.forEachMutation((mutation, key) => {
        store.mutations[namespace + key] = store.mutations[namespace + key] || []
-       store.mutations[namespace + key].push(payload => mutation.call(store, module.state, payload))
+       store.mutations[namespace + key].push(payload => mutation.call(store, getState(store, path), payload))
    })
    // 没用namespace，则所有模块的getters默认都会合并到一个对象里，都是直接getters.xxx即可，而不用getters[a/xxx]
    module.forEachGetters((getterFn, key) => {
-       store.wrapGetters[namespace + key] = () => getterFn.call(store, module.state)
+       store.wrapGetters[namespace + key] = () => getterFn.call(store, getState(store, path))
    })
}

export class Store {
    constructor (options) {
        // code...
+       this._subscribe = [] // 因为能传入多个插件，所以会有多个订阅

+       // 默认插件就会被执行，从上往下执行
+       options.plugins.forEach(plugin => plugin(this))
    }
+   subscribe (fn) {
+       this._subscribe.push(fn)
+   }
+   replaceState (newState) {
+       this._vm._data.$$state = newState
+   }
    commit = (type, payload) => { // ES7语法，类的箭头函数，表示this永远指向store实例
        if (this.mutations[type]) {
            this.mutations[type].forEach(fn => fn(payload)) // 不同于之前，现在的mutations已经是个包含模块中mutations的数组

            // 变更后，触发插件订阅执行
+           this._subscribe.forEach(fn => fn({ type, payload }, this.state))
        }
    }
}
```

## mutations和actions区别的实现
原生`vuex`，如果采用严格模式`strict: true`，那么在`mutations`中采用异步待会将会报错，非合法操作也会报错
主要通过在`store`中`_withCommiting`来包裹合法操作赋值，实现思路是通过`watcher`进行监听（同步，深度），`store`中添加标记位，当数据变化时，如果断言为false则会出现报错
```diff
const installMudole = (store, path, module, rootState) => {
    if (path.length > 0) { // 是子模块
-       Vue.set(parent, path[path.length - 1], module.state)
+       store._withCommiting(() => Vue.set(parent, path[path.length - 1], module.state))
    }
}

export class Store {
    constructor (options) {
        // code...
+       this.strict = options.strict
+       this._commiting = false
+       this._withCommiting = function (fn) {
+           const commiting = this._commiting
+           this._commiting = true
+           fn() // 修改状态的逻辑
+           this._commiting = !commiting
+       }
    }
    replaceState (newState) {
-       this._vm._data.$$state = newState
+       this._withCommiting(() => (this._vm._data.$$state = newState))
    }
    commit = (type, payload) => { // ES7语法，类的箭头函数，表示this永远指向store实例
        if (this.mutations[type]) {
-           this.mutations[type].forEach(fn => fn(payload))
+           // 执行_withCommiting时，_commiting为true，所以不会报错
+           // 如果mutations中有异步代码，那么异步代码执行后，触发watcher监听变化，此时的_commiting会为false，就会报错
+           this._withCommiting(() => this.mutations[type].forEach(fn => fn(payload))) // 不同于之前，现在的mutations已经是个包含模块中mutations的数组

            // 变更后，触发插件订阅执行
            this._subscribe.forEach(fn => fn({ type, payload }, this.state))
        }
    }
}

function resetStoreVM (store, state) {
    // code...

+   if (store.strict) {
+       // 因为watcher执行时异步的，需要加上 {sync: true} 设置为同步，文档没有，需要自行看源码
+       store._vm.$watch(() => store._vm._data.$$state, () => {
+           console.assert(store._commiting, '非法操作')
+       }, { sync: true, deep: true })
+   }
}
```
