主要记录关键知识点，并非源码，仅适合想了解vue底层原理或准备面试者。

## 准备工作：rollup安装
---
与webpack之间得选择：
类库或工具库 - rollup，打包结果不会有依赖（runtime与bundle）
项目开发 - webpack

#### 一、安装相关依赖
`npm i rollup @rollup/plugin-babel @babel/core @babel/preset-env rollup-plugin-serve -D`
+ @rollup/plugin-babel：rollup和babel的桥梁
+ @babel/core：babel核心模块
+ @babel/preset-env：es6转es5
+ @rollup-plugin-alias：使用别名
+ rollup-plugin-serve：启动webpack服务

#### 二、新增命令行
package.json中增加shell命令：`"dev": "rollup -c -w"`
+ -c 使用配置文件
+ -w 监听变化，同--watch

#### 三、编写rollup配置
rollup-config.js配置
```js
import serve from 'rollup-plugin-serve'
import babel from '@rollup/plugin-babel'

// 用于打包的配置
export default {
    input: './src/index.js',
    output: {
        file: 'dist/vue.js',
        name: 'Vue', // 全局名字就是vue
        format: 'umd', // window.Vue
        sourcemap: true // es6->es5
    },
    plugins: [
        alias: {
            '@': './src/*'
        },
        babel({
            exclude: 'node_modules/**' // 该目录不需要用babel转换
        }),
        serve({
            open: true,
            openPage: '/public/index.html',
            port: 3000,
            contentBase: '' // 指定根目录，不写会报错
        })
    ]
}
```
.babelrc配置
```json
{
    "presets": [
        "@babel/preset-env"
    ]
}
```

#### 四、增加入口点与index.html
根目录下创建`public\index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <script src="/dist/vue.js"></script>
    <script>
        const vm = new Vue({ // options api
            data () {
                return {}
            },
            methods: {

            },
            computed: {

            },
            watch: {

            }
        })
    </script>
</body>
</html>
```
根目录下创建`src\index.js`
```js
function Vue () {

}

export default Vue
```

#### 五、执行命令，进入源码开发
执行`npm run dev`，查看是否有报错，根目录下是否正确生成dist目录

## Vue初始化状态流程及对象劫持
---
#### vue2.X版本中，vue是一个构造函数
vue2中就是一个构造函数，而不是class
使用class入口文件将会非常臃肿，不符合模块化开发的思想。虽然也能使用Vue.prototype进行混入，但这么做也挺奇葩了
```js
class Vue {
    constructor (options) {
        this._init()
    }
    _init () {}
    _render () {}
}
```

#### options
用户传入的数据，缺点是无法tree-shaking，vue2缺陷，比如methods中有写入未被使用的代码，但vue2中是无法判断该代码是否有被用到，因此没法tree-shaking掉

#### 函数拓展原型
创建`src\init.js`，用于向`Vue`原型上拓展方法，实现模块化拆分
```js
// 通过原型混合的方式，往vue的原型添加方法
export default function initMixin (Vue) {
    Vue.prototype._init = function (options) {
    
    }
}
```

#### vm.$options
vue上所有的属性都可以通过$options获取（代码就不写了，也就是简单的赋值）

#### 初始化状态流程，响应式数据变化
或者叫数据代理，底层原理是通过Object.defineProperty

1. 将所有初始化方法写入initMixin中（初始化对象 -> 加入混合（initMixin） -> 初始化状态（initState） -> 初始化数据（initData））
2. 由于`data`有可能是对象，也有可能是函数，需要对`data`类型进行判断，并赋值到`vm._data`上
`data = vm._data = typeof data === 'function' ? data.call(vm) : data`
3. 为了避免用户设置与取值的时候需要通过vm._data，而是可以直接通过vm来设置获取data中的值，所以将vm._data中的数据做一层代理
```js
// 数据代理
function Proxy (vm, source, key) {
    Object.defineProperty(vm, key, {
        get () {
            return vm[source][key]
        },
        set (newValue) {
            vm[source][key] = newValue
        }
    })
}
```
4. 通过observe方法将对象进行劫持（Object.defineProperty）
```js
class Observer {
    constructor (value) { // 需要对value属性重新定义
        this.walk(value)
    }
    walk (data) {
        // 将对象中所有的key 重新用 defineProperty定义成响应式的
        Object.keys(data).forEach((key) => {
            defineReactive(data, key, data[key])
        })
    }
}

export function defineReactive (data, key, value) { // 该实现也是为什么vue2中数据嵌套不要过深，过深浪费性能
    // value可能也是一个对象
    observe(value) // 对结果递归拦截

    Object.defineProperty(data, key, {
        get () {
            return value
        },
        set (newValue) {
            // 值没变化，无需重新设置
            if (newValue === value) return
            observe(newValue) // 如果用户设置的是一个对象，就继续将用户设置的对象变成响应式的
            value = newValue
        }
    })
}

export function observe (data) {
    if (typeof data !== 'object' || data == null) return

    // 通过类来实现对数据的观测，类可以方便拓展，会产生实例
    return new Observer(data)
}
```

## Vue数组劫持
---

虽然walk中可以对数组进行监听，但这样得处理方式相当低效，因为数组元素相对较多
因此对数组劫持是劫持的数组方法（AOP切片编程），通过`Object.create(Array.prototype)`来继承数组原型

```js
 // 不能直接改写数组原方法，也就是不能直接 Array.prototype.push = fn 直接改写，这样数组原功能也会被覆盖掉
// 需要通过 Object.create(Array.prototype) 来创建一个对象，通过原型链来获取到数组的方法
let oldArrayMethods = Array.prototype

export let arrayMethods = Object.create(Array.prototype)
// 7个会改变原数组的方法，而其他诸如concat slice等都不会改变原数组
let methods = ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse', 'sort']

// AOP切片编程
methods.forEach(method => {
    arrayMethods[method] = function (...args) {
        console.log('数组变化了，这里是劫持数组当中')
        // 调用数组原有方法执行
        const result = oldArrayMethods[method].call(this, ...args)
        return result
    }
})
```
劫持到数组方法之后，在observe中Object.setPrototypeOf()来将数组类型的原型链指向改写后的拦截数组
```js
class Observer {
    constructor (value) { // value 最初为 data 传入的每一项数据
        // value可能是对象 也可能是数组，需要分开处理
        if (Array.isArray(value)) {
            // 这一句是为了在 arrayMethods中可以使用 observeArray 方法，如果是数组，则会在数组上挂载一个 Observer 实例
            // 在数组arrayMethods拦截中可以使用 observeArray 来对数组进行观测
            value.__ob__ = this

            // 数组不用defineProperty来进行代理 性能不好
            // 如果是数组，则将数组原型链指向被劫持后的数组，这样如果是改变数组的方法则会先被劫持，否则通过原型链使用数组方法
            Object.setPrototypeOf(value, arrayMethods)
            this.observeArray(value) // 原有数组中的对象
            // value.__proto__ = arrayMethods // 同上，但这种写法非标准。个人文章：https://www.jianshu.com/p/28a0164b0d63
        } else {
            this.walk(value)
        }
    }
    // 监控数组中是否为对象，如果是则进行劫持
    observeArray (value) {
        for (let i = 0; i < value.length; i++) {
            observe(value[i])
        }
    }
    walk (data) {
        // 将对象中所有的key 重新用 defineProperty定义成响应式的
        Object.keys(data).forEach((key) => {
            defineReactive(data, key, data[key])
        })
    }
}
```
如果初始化数组数据中有对象，还需要对对象进行劫持
```js
// 监控数组中是否为对象，如果是则进行劫持
observeArray (value) {
    for (let i = 0; i < value.length; i++) {
        observe(value[i])
    }
}
```
此时还仅是对初始化的数据进行，还需要对插入的数据也进行观测（如果是对象或数组也需要继续进行观测）
拦截数组`arrayMethods`中需要使用`Observer`的observeArray方法，因此需要将`Observer`挂在到该数组的`__ob__`中，这样在arrayMethods中就可以使用observeArray
```diff
// observer\index.js
class Observer {
    constructor (value) {
+       // 这一句是为了在 arrayMethods中可以使用 observeArray 方法，如果是数组，则会在数组上挂载一个 Observer 实例
+       // 在数组arrayMethods拦截中可以使用 observeArray 来对数组进行观测
+       value.__ob__ = this
    }
}

// observer\array.js
methods.forEach(method => {
    arrayMethods[method] = function (...args) {
        // code...

        // 如果有值则需要使用 observeArray 方法，通过 Observer 中对每一项进行监控时，如果为数组则会在该数组属性上挂上数组遍历方法
+        if (inserted) {
+            ob.observeArray(inserted)
+        }

        // 调用数组原有方法执行
        const result = oldArrayMethods[method].call(this, ...args)
        return result
    }
})
```
而`__ob__`其实就是`Observer`，那么去到walk的时候，进入属性监控，而`__ob__`就是其本身`Observer`，那么就会无限递归，因此需要将其设置为不可枚举
```diff
// observer\index.js
class Observer {
    constructor (value) {
        // 这一句是为了在 arrayMethods中可以使用 observeArray 方法
        // 在数组 arrayMethods 拦截中可以使用 observeArray 来对数组进行观测
-       value.__ob__ = this
+       Object.defineProperty(value, '__ob__', {
+           value: this,
+           enumerable: false, // 不能被枚举，否则会导致死循环
+           configurable: false // 不能删除此属性
+       })
    }
}
```
通过该属性`__ob__`，可以在`observe`方法中进行判断，如果已经检测过了则直接return即可，不用每次更改都进行一次监听
```diff
export function observe (data) {
+   if (data.__ob__) return // 如果有__ob__，证明已经被观测了
}
```
<br>

---
手写Vue2核心系列：
[手写Vue2核心（一）： 搭建环境与对象/数组劫持](https://www.jianshu.com/p/7969bc3090ab)
[手写Vue2核心（二）： 模板渲染](https://www.jianshu.com/p/9c0041afdf15)
