## 侦听器watch的实现原理
[官方watch使用方式文档](https://cn.vuejs.org/v2/api/#watch)
`Vue`中`watch`的使用方式有多种，包括：
+ 函数形式
```js
'test' (newVal, oldVal) {}
```
+ 对象形式
```js
'test': {
    hadler () {}
}
```
+ 监控当前实例上的方法
```js
watch: {
    'test': testMethod
},
methods: {
    testMethod (newVal, oldVal) {}
}
```
+ 写成 key 和数组的方式，会逐一调用
```js
'test': [
    (newVal, oldVal) => {},
    function handle2 (val, oldVal) {},
    {
        handler: function handle3 (val, oldVal) {},
    }
]
```
前面只实现了渲染watcher，现在来实现侦听器watcher（当然都是同一个watcher构造函数）
改写init.js，将实例方法脱离出来，采用混入的方式来维护
```diff
// init.js
export function initMixin (Vue) {
+   stateMixin(Vue)
-   Vue.prototype.$nextTick = nextTick
}
```
上面写了watch多种使用方式，所以需要对watch进行处理，如果是数组则依次调用Vue.$watch来执行，否则则直接执行
```js
// state.js
function initWatch (vm) {
    let watch = vm.$options.watch
    for (let key in watch) {
        const handler = watch[key]

        if (Array.isArray(handler)) {
            handler.forEach(handle => {
                createWatcher(vm, key, handler)
            })
        } else {
            createWatcher(vm, key, handler) // 字符串、对象、函数
        }
    }
}

function createWatcher (vm, exprOrFn, handler, options) { // options 可以用来标识是用户watcher
    if (typeof handler === 'object' && typeof handler !== 'null') {
        options = handler
        handler = handler.handler // 是一个函数
    }

    if (typeof handler === 'string') {
        handler = vm[handler] // 将实例的方法作为handler
    }

    return vm.$watch(exprOrFn, handler, options)
}

export function stateMixin (Vue) {
    Vue.prototype.$nextTick = function (cb) {
        nextTick(cb)
    }
    Vue.prototype.$watch = function (exprOrFn, cb, options) {
        // 数据应该迎来这个watcher，数据变化后应该让watcher从新执行
        let watcher = new Watcher(this, exprOrFn, cb, {...options, user: true}) // user: true 用于标识是用户写的侦听器，非渲染watcher
        if (options.immediate) {
            cb() // 如果是immediate，则立即执行
        }
    }
}
```
渲染watch与用户传入定义的watch，主要区分在于是否存在user属性，如果有则证明是用户传入的watch，否则为渲染watch
watch需要对新老值进行比较，如果不一致则去调用绑定回调，因此还需要改写`get`与`run`方法，来记录新老值并进行对比（之前仅获取不会保留获取的值）
```diff
// observer\watcher.js
class Watcher {
    constructor (vm, exprOrFn, cb, options={}) {
+       this.user = options.user // 用户watcher

+       if (typeof exprOrFn === 'function') {
+           this.getter = exprOrFn
+       } else {
+           this.getter = function () { // exprOrFn传递过来的可能是字符串，也可能是函数
+               // 当去当前实例上取值时，才会触发依赖收集
+               let path = exprOrFn.split('.')
+               let obj = vm
+               for (let i = 0; i < path.length; i++) {
+                   obj = obj[path[i]]
+               }
+               return obj
+           }
+       }

        // 默认会先调用一次get方法，进行取值，将结果保存下来
-       this.get()
+       this.value = this.get()
    }
    // 这个方法中会对属性进行取值操作
    get () {
        pushTarget(this) // Dep.target = watcher
-       this.getter() // 取值
+       let result = this.getter() // 取值
        popTarget()

        return result
    }
    // 当属性取值时，需要记住这个watcher，稍后数据变化了，去执行自己记住的watcher即可
    addDep (dep) {
        let id = dep.id
        if (!this.depsId.has(id)) { // dep是非重复的
            this.depsId.add(id)
            this.deps.push(dep)
            dep.addSub(this)
        }
    }
    // 真正触发更新
    run () {
-       this.get()
+       let newValue = this.get()
+       let oldValue = this.value
+       this.value = newValue // 将老值更改掉
+       if (this.user) {
+           this.cb.call(this.vm, newValue, oldValue)
+       }
    }
    update () { // 多次更改，合并成一次（防抖）
        queueWatcher(this)
    }
}
```

## computed的实现原理
computed的主要实现包括以下三要素：
1. 通过`Object.defineProperty`进行劫持，因为计算属性主要用于取值，需要进行取值处理，如果值有变更需要通知视图更新
2. 计算属性watcher，用于取值逻辑与通知视图更新
3. 具有缓存，通过属性`dirty`标识，如果`dirty`为`true`则证明需要重新取值，否则直接使用缓存值`value`即可

一般流程太长逻辑太绕的我都会将流程一步步用中文描述写下来，有需要的就直接跟着源码与我写下的流程对着看吧
1. 如果用户有传入computed属性，则初始化计算属性`initComputed`
2. 在`vue._computedWatchers`上存储计算属性watcher
3. 循环遍历计算属性，获取计算属性表达式（如果是对象形式，则获取get属性表达式）
4. 为该属性分配一个计算属性watcher，并设置`lazy: true`，用于标识，因为计算属性默认不做任何操作
5. 定义计算属性`defineComputed`，返回一个高阶函数。当计算属性被使用时，该高阶函数将会触发对计算属性中所使用的属性值进行依赖收集，属性的依赖收集会将当前`watcher`进行记录，此时计算属性中使用到的属性值都会记录到该计算属性`watcher`，记录后则销毁该`watcher`(`popTarget中的stack.pop()`)，然后判断是否还有`watcher`（`Dep.target`），如果有说明还有渲染`watcher`，也需要一并被收集起来
6. 最后通过`Object.defineProperty`进行劫持（简单总结起来就是，计算属性使用时，里面所使用的属性会记录该计算属性watcher）
到这一步劫持收集完毕，依赖属性记录的Dep中既有渲染watcher，也有计算属性watcher，发生变更时，触发`dep.notify`，将存储的`watcher`逐一执行（栈结构，渲染watcher在栈底，计算属性`watcher`的update仅为更改`dirty`标识，而渲染`watcher`会触发视图更新）

```diff
// state.js
export function initState (vm) {
+   if (opts.computed) {
+       initComputed(vm)
+   }
}

+ // 初始化计算属性
+ function initComputed (vm) {
+     let computed = vm.$options.computed
+     // 1. 需要有watcher 2. 需要通过defineProperty 3. dirty
+     const watchers = vm._computedWatchers = {} // 用来存放计算属性的watcher
+ 
+     for (let key in computed) {
+         const userDef = computed[key]
+         const getter = typeof userDef === 'function' ? userDef : userDef.get
+ 
+         watchers[key] = new Watcher(vm, getter, () => {}, {lazy: true})
+         defineComputed(vm, key, userDef)
+     }
+ }
+ 
+ function defineComputed (target, key, userDef) {
+     const sharedPropertyDefinition = {
+         enumerable: true,
+         configurable: true,
+         get: () => {},
+         set: () => {}
+     }
+ 
+     // 函数式
+     if (typeof userDef === 'function') {
+         sharedPropertyDefinition.get = createComputedGetter(key) // 通过dirty来控制是否调用userDef
+     } else {
+         sharedPropertyDefinition.get = createComputedGetter(key) // 需要加缓存
+         sharedPropertyDefinition.set = userDef.set
+     }
+ 
+     Object.defineProperty(target, key, sharedPropertyDefinition)
+ }
+ // 用户取值时调用该方法
+ function createComputedGetter (key) {
+     return function () { // 高阶函数，每次取值调用该方法
+         const watcher = this._computedWatchers[key]
+         if (watcher) {
+             if (watcher.dirty) { // 判断是否需要执行用户传递的方法，默认肯定是脏的
+                 watcher.evaluate() // 对当前watcher求值
+             }
+ 
+             if (Dep.target) {
+                 watcher.depend()
+             }
+ 
+             return watcher.value // 默认返回watcher上存的值
+         }
+     }
+ }
```
```diff
// observer\dep.js
class Dep {
    notify () {
-       this.subs.forEach(watcher => watcher.update())
+       this.subs.forEach(watcher => {
+           watcher.update()
+       })
+   }
}

let stack = []

export function pushTarget (watcher) {
    Dep.target = watcher
+   stack.push(watcher) // stack有渲染watcher，也有其他watcher
}

export function popTarget () {
-   Dep.target = null
+   stack.pop() // 栈型结构，第一个为渲染watcher，后面的为其他watcher，watcher使用过就出栈
+   Dep.target = stack[stack.length - 1]
}
```
```diff
// observer\watcher.js
class Watcher {
    constructor (vm, exprOrFn, cb, options={}) {
+       this.lazy = options.lazy // 如果watcher上有lazy属性，说明是一个计算属性
+       this.dirty = this.lazy // dirty代表取值时是否执行用户提供的方法，可变

        // 默认会先调用一次get方法，进行取值，将结果保存下来
+       // 如果是计算属性，则什么都不做（计算属性默认不执行）
+       this.value = this.lazy ? void 0 : this.get()
    }
    // 这个方法中会对属性进行取值操作
    get () {
        pushTarget(this) // Dep.target = watcher
        // data属性取值，触发updateComponent，其中this指向的时vm
        // computed属性取值，会执行绑定的函数，该函数中的this指向的是该watcher，所以this指向会有问题，需要call(this.vm)
-       let result = this.getter() // 取值
+       let result = this.getter.call(this.vm)
        popTarget()

        return result
    }
    update () { // 多次更改，合并成一次（防抖）
+       if (this.lazy) {
+           this.dirty = true
+       } else {
+           // 这里不要每次都调用get方法，get会重新渲染页面
            queueWatcher(this)
+       }
    }
+   evaluate () {
+       this.value = this.get()
+       this.dirty = false // 取过值后标识，标识已经取过值了
+   }
+   depend () {
+       // 计算属性watcher会存储dep，dep会存储watcher
+       // 通过watcher找到对应的所有dep，让所有的dep都记住这个渲染watcher
+       let i = this.deps.length
+       while (i--) {
+           this.deps[i].depend()
+       }
+   }
}
```