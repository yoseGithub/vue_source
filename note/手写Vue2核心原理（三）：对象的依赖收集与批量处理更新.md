## 对象的依赖收集与批量处理更新
---
目前已经实现的功能及流程梳理：
1. 对数据进行了拦截：对象劫持（Object.defineProPerty） 数组（AOP切面编程，对七个能改变数组方法进行拓展）
2. 统一render，通过template模板解析成AST语法树（描述语法）
3. 通过AST语法树生成reder函数（可被执行的js字符串），使用with添加词法作用域，使用new Function()来执行render函数，生成虚拟Dom
4. 当`new Vue`时会产生一个watcher（渲染watcher），该watcher主要有两个功能，调用vm._update(vm._render())来创建真实节点

此时如果想更改数据并重新触发渲染，可以通过`vm._update(vm._render())`触发视图的重新渲染（可理解为Vue.$forceUpdate）
```js
vm.name = 'newName'
vm._update(vm._render())
```

vue的双向数据绑定，是数据发生变更则视图也对应更新，而不是需要用户手动去触发。需要用到依赖收集，发生变化的时候视图能触发更新
首先明确一点，属性变化，记录在dep中，而实例化vue的时候，是记录的watcher，每次实例都会产生一个watcher，而每个属性在依赖收集阶段都会产生一个dep
watcher与dep是相互记录的，所以可以理解为每个属性都有dep和watcher，dep是不一样的，但是用的都是同一个实例的watcher

lifecycle中进行挂载的时候，同时会生成一个`watcher`实例，watcher的功能就是去触发更新（_update），每个组件都是一个vue实例，所以每个组件都会创建一个watcher
目前只实现渲染watcher，因此没有在模板中渲染的属性是不会被加入watcher中的。组件挂载，视图更新流程：
`init -> mountComponent() -> new wattcher() -> updateComponent() -> vm._update(vm._render())`

而dep则是在defineReactive方法中生成的，dep中会记录当前vue实例的watcher，由此来触发更新
视图更新后，又会去到watcher.get方法，从而让依赖重新收集
`Observer -> walk -> defineReactive -> new Dep()`

observer\dep.js：
```js
// dep存在的意义：watcher是为了监听，取值的时候会触发记录
let id= 0

class Dep {
    constructor () {
        this.id = id++
        this.subs = [] // 属性要记住watcher
    }
    // 如果有报错可自行安装babel插件（@babel/plugin-proposal-class-properties），又或者在外部写成 Dep.target = null
    static target = null
    depend () {
        // 让watcher记住dep
        Dep.target.addDep(this) // this为渲染watcher
    }
    addSub (watcher) {
        this.subs.push(watcher)
    }
    notify () {
        this.subs.forEach(watcher => watcher.update())
    }
}

export function pushTarget (watcher) {
    Dep.target = watcher
}

export function popTarget (watcher) {
    Dep.target = null
}

export default Dep 
```
observer\watcher.js
```js
// watcher 记住dep是为了计算属性和让用户调用
import { popTarget, pushTarget } from "./dep"

let id = 0

class Watcher {
    constructor (vm, exprOrFn, cb, options) {
        this.vm = vm
        this.cb = cb
        this.id = id++ // 不同组件id都不一样
        this.options = options
        this.getter = exprOrFn // 调用传入的函数
        this.deps = [] // watcher 里也要记住dep
        this.depsId = new Set()

        this.get()
    }
    // 这个方法中会对属性进行取值操作
    get () {
        pushTarget(this) // Dep.target = watcher
        this.getter() // 取值
        popTarget()
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
    update () {
        this.get()
    }
}

export default Watcher
```

```diff
+ import Dep from './dep.js'

export function defineReactive (data, key, value) { // vue2中数据嵌套不要过深，过深浪费性能
+   let dep = new Dep() // 每次都会给属性创建一个dep
    Object.defineProperty(data, key, { // 需要给每个属性都添加一个Dep
        get () {
+           if (Dep.target) {
+              dep.depend() // 让这个属性自己的dep记住这个watcher
+           }
            return value
        },
        set (newValue) {
            // code...
+           dep.notify() // 通知 dep 中记录的 wathcer 让它去执行
        }
    })
}
```

考虑到大部分人应该也不会去看前两篇文章，所以将vue从初始化到依赖收集一整套流程记录下来，有需要的通过源码，并根据我这里写的关键方法一步步看下去（毕竟是一个高频面试题，重要的知识点）：
+ 初始化`vue._init`
+ `initData`
+ `observe`
+ `new Observer(data)`
+ `walk`
+ `defineReactive`
+ `new Dep()`
+ get设置`dep.deppend`来让`watcher`记录当前`dep`，`set`通知更新视图（get/set此时都不会被触发）
-----》 生命周期 -----》
+ 挂载`Vue.prototype.$mount`
+ `mountComponent`
+ `new Watcher`
+ `this.get()`
+ `pushTarget`，将`Dep.target`记录为当前`watcher`
+ `updateComponent`
+ `_render`
+ `属性取值，触发get`
+ `dep.depend`
+ 判断是否已记录过该`dep`，没有则记录并加入到观测队列中，让当前`watcher`记住该`dep`，也让`dep`记住自己这个`watcher`
+ `popTarget去除记录的watcher`

总结整个双向数据绑定流程：
1. 初始化数据时，会生成一个Observer实例
2. Observer实例生成时，会产生一个Dep实例，并在get方法中让watcher与dep的相互记录（多对多关系，观察者模式，此时get/set并未执行，所以此时并未真正相互记录）
3. 组件挂载，执行mountComponent，此时会创建一个watcher（渲染watcher）
4. 执行Watcher.get方法，该方法处理三个步骤：将Dep中的targtet设置为该Watcher，执行渲染函数（此时会取值，触发2步骤中get，watcher与dep的相互记录），渲染之后移除Dep.target
5. 4步骤时，dep与Watcher已相互记录，当属性发生改变时，dep中的notify方法会将自己记录到的所有watcher都执行一次update方法，也就是触发视图更新（这里只实现到渲染watcher，所以只会记录到一个）
6. 视图更新，又会重新触发watcher.get方法，依赖将会重新收集（页面可能存在有v-if/v-else，所以需要重新收集）

看到这里也能总结一个结论：
不在模板中使用的属性，由于4步骤中，它并不会出现在render中（没有触发get），所以没有在Dep.target存在的时候（4步骤最后一步会移除）进行dep与watcher的相互记录，因此不会进行依赖收集

## 批量处理更新操作
---
目前遗留一个问题，当更改属性值的时候，每更改一次就会触发一次更新（diff算法放后面实现）
```js
setTimeout(_ => {
    vm.name = 'AA'
    vm.name = 'BB'
    vm.name = 'CC'
})
```
每次更新都会走到watcher中的update()，也就是一直重复渲染，即使最终只更改了一次有效值（可能有的人会尝试都写成AA结果只触发了一次渲染，注意回去看对象劫持时set，已经判断了一次新旧值如果一样就return）
每个watcher的ID都会进行累加，所以不会出现重复的watcher，因此可以通过去重来执行更新操作
observer\watcher.js
```diff
+ import { queueWatcher } from "./schedular"
class Watcher {
+   // 真正触发更新
+   run () {
+       console.log('触发视图更新')
+       this.get()
+   }
    update () { // 多次更改，合并成一次（防抖）
+       queueWatcher(this)
-       this.get()
    }
}
```
observer\schedular.js
```js
// 调度文件
// let watcherIds = new Set() // 源码用的对象，不知道为什么前面 depsId 用 set ，这里去重却用了对象 has
let has = {}
let queue = []

function flushSchedularQueue () {
    for (let i = 0; i < queue.length; i++) {
        let watcher = queue[i]
        watcher.run()
    }
    // watcherIds.clear()
    has = {}
    queue = []
}

export function queueWatcher (watcher) { // 调度更新几次
    // 更新时对watcher进行去重操作
    const id = watcher.id
    // if (!watcherIds.has(id))
    if (has[id] == null) {
        queue.push(watcher)
        // watcherIds.add(id)
        has[id] = true

        // 让queue清空
        setTimeout(flushSchedularQueue, 0)
    }
}
```

## nextTick实现
---
直接多次使用setTimeout，那么就会有多个定时器产生，并且导致视图重复更新
```js
// 当代码中重复使用setTimeout来更改值，其实页面上最终呈现的为CC，但还是会多次触发视图更新
setTimeout(() => {
    vm.name = 'AA'
})
setTimeout(() => {
    vm.name = 'BB'
})
setTimeout(() => {
    vm.name = 'CC'
})
```
![多次触发视图更新](https://upload-images.jianshu.io/upload_images/13936697-5fdb28303bfc034d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

vue中有一个重要的方法：nextTick，当用户多次调用时，只会在数据更新后再统一执行（**不会产生多个异步任务**）
nextTick实现原理也很简单，先将用户要执行的函数存起来，等数据更改完，视图更新之后再执行即可（eventLoop）

```diff
// observer\schedular.js
+ import { nextTick } from "@/util.js"
export function queueWatcher (watcher) {
+       nextTick(flushSchedularQueue)
-       setTimeout(flushSchedularQueue, 0)
    }
}
```
```js
// util.js
// 因为工具方法不多，所以没像源码那样再建一个文件夹，源码：src\core\util，具体看next-tick.js ，这里只说实现原理，不会写那么多兼容
let callbacks = []
// 由于批处理的时候会执行nextTick，用户也可能会去调用nextTick，会导致重复执行，因此需要将所有调用nextTick的逻辑都先锁上，等到全部处理完再放开
let waiting = false

function flushCallbacks () {
    console.log('产生异步任务')
    for (let i = 0; i < callbacks.length; i++) {
        let callback = callbacks[i]
        callback()
    }
    waiting = false
    callbacks = []
}

// 批量处理，第一次开定时器，后续只更新列表，之后执行清空逻辑
// 第一次cb是渲染watcher更新操作（渲染watcher执行的过程肯定是同步的）
// 第二次cb是用户传入的回调
export function nextTick(cb) {
    callbacks.push(cb)
    if (!waiting) {
        waiting = true
        Promise.resolve().then(flushCallbacks) // 多次调用nextTick，只会开启一次Promise

        // 1. Promise
        // 2. mutationObserver
        // 3. setImmdiate
        // 4. setTimeout
        // 由于 vue3 已不再考虑兼容性，里面直接用的 Promise，所以这里就不重现了，有兴趣自行看源码
    }
}
```
```js
vm.$nextTick(() => {
    vm.name = 'AA'
})
vm.$nextTick(() => {
    vm.name = 'BB'
})
vm.$nextTick(() => {
    vm.name = 'CC'
})
```

![只会触发一次视图更新](https://upload-images.jianshu.io/upload_images/13936697-752bc50dba1eaca0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

关于去重的总结：
1. 每个属性被劫持时都会有产生一个Dep
2. 每个vue实例都会产生一个渲染Watcher
3. 如果模板中多次使用了同一属性，依赖收集阶段会产生Dep实例（唯一id），Watcher中会对DepId进行去重
Dep与Watcher会相互记录，Dep
4. 同一属性值变更：
    + 不停设置同一个值，在set中通过新旧值判断是否一致来决定触发更新
    + 不停设置不同值，依赖于watcher去重，因为watcherId一致，`watcher.update`方法中通过id队列来去重（schedular\queueWatcher），在nextTick中批量更新watcher
5. 不同属性值变更，视图更新去重，依赖nextTick来批量更新视图
6. 多次异步任务更改值，视图更新去重，依赖于nextTick（当然如果还是用setTimeout那依旧没法去重）

## 数组的依赖收集
---
如果属性是数组，那么按照以下写法，arr会触发视图更新，arr2则无法触发更新。原因在于render.js中的_s方法使用了`JSON.stringify`（对鬓语法进行取值），对象取值，从而产生依赖收集，而更改数组时并不会触发更新通知（因为每一项都是基本类型值，非对象，无法像上面一样获取值时让dep与watcher相互记录）

```js
const vm = new Vue({ // options api
    el: '#app',
    data () {
        return {
            arr: [{name: 'yose'}],
            arr2: [1, 2, 3]
        }
    }
})

setTimeout(() => {
    vm.arr[0].name = '萌王'
}, 1000)
setTimeout(() => {
    vm.arr2[0] = 4
}, 1000)
```
前面observe方法中，会对data的所有属性值进行劫持（`observe`方法），对象类型都会被劫持（数组也是对象），无法给数组基本类型值添加Dep，那就在属性本身的**值**加上，这样当我们触发数组变更的方法时，再去调用该属性上的dep.notify，就能触发视图更新（为什么不只对数组添加dep属性，而是一起加了，这个问题在后面会有用，因为对象添加属性可以使用$set方法来添加响应，用的也是该属性自身的dep）
```diff
// observer\index.js
class Observer {
+       this.dep = new Dep() // 给数组和对象本身增加一个dep属性
}

export function defineReactive (data, key, value) { // vue2中数据嵌套不要过深，过深浪费性能
    // value可能也是一个对象，需要再次递归
    const childOb = observe(value) // 对结果递归拦截

    Object.defineProperty(data, key, { // 需要给每个属性都添加一个Dep
        get () {
            if (Dep.target) {
+               // childOb可能是对象，也可能是数组
+               if (childOb) {
+                   childOb.dep.depend()
+               }
            }
            return value
        }
    })
}
```
```diff
// observer\array.js
methods.forEach(method => {
        // ...code
+       ob.dep.notify()

        // 调用数组原有方法执行
        const result = oldArrayMethods[method].call(this, ...args)
        return result
    }
})
```
到这里，数组本身更改已经可以触发视图更新，但还有可能arr是一个多维数组（例如`arr: [[1, 2, 3]]`），那么里面的数组发生变更，也需要触发更新，因此需要对里面的数组也进行一次dep挂载来收集依赖
```diff
// observer\index.js
+ function dependArray (value) {
    for (let i = 0; i < value.length; i++) {
        let current = value[i]
        current.__ob__ && current.__ob__.dep.depend()

        if (Array.isArray(current)) {
            dependArray(current) // 递归依赖收集
        }
    }
}
export function defineReactive (data, key, value) { // vue2中数据嵌套不要过深，过深浪费性能
    // value可能也是一个对象，需要再次递归
    const childOb = observe(value) // 对结果递归拦截

    Object.defineProperty(data, key, { // 需要给每个属性都添加一个Dep
        get () {
            if (Dep.target) {
                // childOb可能是对象，也可能是数组
                if (childOb) {
                    childOb.dep.depend()
+                   if (Array.isArray(value)) {
+                       dependArray(value)
+                    }
+               }
            }
            return value
        }
    })
}
```

总结：
dep，除了属性上有，如果属性的值为对象，那么其值也会挂上dep，值如果还是数组那就继续递归，从而实现一个大型递归现场，到处有dep，只要你是个对象你就有dep，只要你是对象上的属性你就有dep，虽然恶心，但应该当时也没有什么更好的办法，等后面有空学vue3源码再来了解一下这一块有没有更好的方案