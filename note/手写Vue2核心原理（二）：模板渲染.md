## 模板渲染
---
因为vue模板中存在指令，修饰符，循环等，只替换变量是不健全的。因此需要有一套模板渲染，来识别vue模板并执行
涉及知识点：模板编译原理 AST语法树 先识别出HTML，将其转换成js语法
1. 需要将模板变成一个 render 方法
2. 需要去当前的实例上取值 `with`
3. 虚拟DOM => 对象 可以描述DOM结构（diff算法）
4. 生成一个真实的DOM结构，到页面中渲染

#### 获取HTML模板，统一render
通过判断vm.options中的属性
+ 如果有render 就直接使用 render
+ 没有render 看有没有template属性
+ 没有template 就接着找外部模板（el）
```js
Vue.prototype.$mount = function (el) {
    el = document.querySelector(el)
    const vm = this
    const options = vm.$options

    // 如果有render 就直接使用 render
    // 没有render 看有没有template属性
    // 没有template 就接着找外部模板
    if (!options.render) {
        let template = options.template
        if (!template && el) {
            // 返回内容包含描述元素及其后代的序列化HTML片段，火狐不兼容，可以使用document。createElement('div').appendChild('app').innerHTML来获取
            template = el.outerHTML
        }
        const render = compileToFunctions(template)
        options.render = render // 通过这个步骤，统一为render
    }
}
```

#### 解析HTML，获取标签、文本、属性
获取到HTML后开始解析模板。使用正则来匹配获取标签与属性，这一步主要在于实现如何解析HTML，分别分析出开始标签、文本、结束标签
这里没处理单标签，还有一些特殊情况如style/script/pre/textarea标签等也不会处理，只是学习实现原理，有兴趣的自行看源码 [html-parser源码](https://github.com/vuejs/vue/blob/2.6/src/compiler/parser/html-parser.js)

```
<!-- DOM结构 -->
<div id="app" class="wrap" disabled>
    <div style="color: red">
        <span>{{name}}</span>
    </div>
</div>
```

```js
// compiler\parse.js
// 直接从github上源码搬运过来的正则 https://github.com/vuejs/vue/blob/edf7df0c837557dd3ea8d7b42ad8d4b21858ade0/packages/vue-template-compiler/build.js#L270
const ncname = '[a-zA-Z_][\\w\\-\\.]*' // 匹配标签名
const qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")" // 匹配带前缀的标签名 <aa:span>，有命名空间的标签
const startTagOpen = new RegExp(("^<" + qnameCapture))
const endTag = new RegExp(("^<\\/" + qnameCapture + "[^>]*>"))
// 例如 style     =     "xxx" 或 style="xxx" 或 style='xxx' 或 style=xxx
// 如果不需要捕获=号，则改成/^\s*([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const startTagClose = /^\s*(\/?)>/
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g

export function parseHTML (html) {
    // 前进，为了减少解析，需要在解析后则删除掉（前进一段）
    function advance (n) {
        html = html.substring(n)
    }

    // 解析起始标签
    function parseStartTag () {
        const start = html.match(startTagOpen)
        if (start) {
            let match = {
                tagName: start[1],
                attrs: []
            }

            advance(start[0].length) // 截取至<div
            // console.log(html, match) // 到这一步可查看下图《截取后的结果》

            // 查找属性
            let end, attr
            // 不是开头标签结尾并且有属性值
            // !(end = html.match(startTagClose) 这里是赋值跟返回放在一起，相当于先赋值end = html.match(startTagClose，再判断end
            while(!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                advance(attr[0].length)

                match.attrs.push({
                    name: attr[1],
                    value: attr[3] || attr[4] || attr[5] || true // 可能是 a="1" a='1' a=1，都没有则为true，比如 disabled 等同于 disabled="true"
                })

                // console.log(attr) // 到这一步可查看下图《匹配出来的attr》
            }

            if (end) {
                advance(end[0].length)
                return match
            }
        }
    }

    while (html) {
        let textEnd = html.indexOf('<')
        // 匹配的 < 号有可能是开始标签，也可能是结束标签
        if (textEnd === 0) {
            // 开始标签
            let startTagMatch = parseStartTag(html)
            if (startTagMatch) {
                console.log('开始标签：' + startTagMatch.tagName)
                continue
            }
            
            // 结束标签，不需要解析获取，只用于前进即可
            let endTagMatch = html.match(endTag)
            if (endTagMatch) {
                advance(endTagMatch[0].length)
                console.log('结束标签：' + endTagMatch[1])
                continue
            }
        }

        let text
        if (textEnd > 0) { // 开始解析文本(有可能是文本，也可能是标签换行留下的空白)
            text = html.substring(0, textEnd)
        }

        if (text) {
            advance(text.length)
            console.log('文本:', text)
        }

        console.log(html)
    }
}

export function compileToFunctions (template) {
    parseHTML(template)
}
```
![截取后的结果](https://upload-images.jianshu.io/upload_images/13936697-c2064ecb8706348a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![匹配出来的attr](https://upload-images.jianshu.io/upload_images/13936697-1ff8e00ace891228.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

#### 生成AST语法树
在解析过程中，根据标签，生成AST语法树（其实解析与生成AST语法树是同步的，分开来讲好理解点）
在分析出开始标签、结束标签和文本后，分别去执行对应的start、end、chars方法，start负责生成语法树，end负责父子节点相互指定
此处涉及两个知识点：
+ 标签通过栈处理，起始标签入栈，结束标签则出栈
+ 双指针，父子节点相互记录


```diff
export function parseHTML (html) {
+   // vue3里面支持多个根元素（外层加了一个空元素），vue2中只有一个根节点
+   function createASTElment (tag, attrs) {
+       return {
+           tag, // 标签
+           type: 1, // 元素类型，1为节点，3为文本
+           children: [], // 子节点
+           attrs, // 属性
+           parent: null // 父节点
+       }
+   }

+   let root = null
+   let currentParent // 当前处理的节点
+   let stack = []

+   // 根据开始标签、结束标签、文本内容，生成AST语法书
+   function start (tagName, attrs) {
+       let element = createASTElment(tagName, attrs)
+       // 创建树根
+       if (!root) {
+           root = element
+       }
+       currentParent = element
+       stack.push(element) // 开始标签入栈
+   }

+   // 栈处理，这里没写异常处理，可以判断标签是否正常闭合，是否有多余标签等
+   function end (tagName) {
+       let element = stack.pop()
+       currentParent = stack[stack.length - 1] // 结束标签出栈
+       // 双指针（父子互相记录）
+       if (currentParent) {
+           element.parent = currentParent
+           currentParent.children.push(element)
+       }
+   }
+
+   
+   function chars (text) {
+       text = text.replace(/\s/g, '') // 去除空格，源码是更改为一个空格，这里为了好判断直接全部去掉
+       if (text) {
+           currentParent.children.push({
+               type: 3,
+               text
+           })
+       }
+   }

    // code...

    while (html) {
        if (textEnd === 0) {
            if (startTagMatch) {
+               start(startTagMatch.tagName, startTagMatch.attrs)
                continue
            }

            if (endTagMatch) {
+               end(endTagMatch[1])
                continue
            }
        }

        if (text) {
            advance(text.length)
+           chars(text)
        }
    }
}
```

![AST语法树](https://upload-images.jianshu.io/upload_images/13936697-6be288d2e43214a7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

#### 生成可执行的代码块
这一步只有一个目标：根据AST语法树，生成一个可被后续执行的js语句（可以将其看成生成vue createElement方法所需的参数）

这一块写起来比较恶心，先说一下实现目标，拿到文本后区分是鬓语法还是普通文本（通过正则`defaultTagRE`）
如果是鬓语法，则生成`_s(变量)`，否则直接拼接上，最后将拼接后的文本放到`_v(处理后的文本)`

关键实现代码：
```js
// 文本不能用_c来处理
// 有{{}} 普通文本 混合文本（前两者集合）
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g
const text = '{{name}} abc {{age}} code'
// 是鬓语法
function gen (text) {
    if (defaultTagRE.test(text)) {
        let tokens = [] // 混合文本存放
        let match
        let index = 0
        let lastIndex = defaultTagRE.lastIndex = 0 // lastIndex获取匹配后指针的位置，由于上面用过一次test，所以指针不已经不是0开始了，需要重置为0

        while(match = defaultTagRE.exec(text)) {
            index = match.index
            console.log(match, index, lastIndex)
            if (index > lastIndex) {
                tokens.push(JSON.stringify(text.slice(lastIndex, index)))
            }
            tokens.push(`_s(${match[1].trim()})`)
            lastIndex = index + match[0].length
        }

        if (lastIndex < text.length) {
            tokens.push(JSON.stringify(text.slice(lastIndex)))
        }
        return `_v(${tokens.join('+')})`
    } else { // 普通文本
        console.log('普通文本')
        return `_v(${JSON.stringify(text)})`
    }
}
console.log(gen(text))
```
`_c` 和 `_v` 方法还未实现，到这里主要是创建出可执行的js代码，输出结果：
```js
// 为了方便观看，格式化后的输出结果：
_c('div',
    {
        id: "app",
        class: "wrap",
        style: {"background-color":" pink"}
    },
    _c('div',
        {style: {"color":" red"}},
        _c('span',
            undefined,
            _v(_s(name))
        )
    )
)

```
generate完整代码：
```js
// compiler\generate.js
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g

function genProps (attrs) {
    let str = ''
    for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i]

        // 如果有行内样式，例如 style="color: red"
        if (attr.name === 'style') {
            let obj = {}
            attr.value.split(';').forEach(item => {
                let [key, value] = item.split(':')
                obj[key] = value
            })
            attr.value = obj
        }

        // 由于字符串拼接，attr.value 会丢失 双引号（或单引号），{id: app}，这样待会解析就变成变量了
        // 所以需要使用JSON.stringify重新将字符串补充上引号 {id: "app"}
        str += `${attr.name}: ${JSON.stringify(attr.value)},` // _c('div', {id: "app",class: "wrap",style: {"background-color":" pink"}})
    }

    return `{${str.slice(0, -1)}}` // 去除最后多余的逗号
}

function genChildren(el) {
    const children = el.children
    if (children) {
        return children.map(child => gen(child)).join(',')
    }
}

// 区分是元素还是文本
function gen(node) {
    if (node.type === 1) {
        return generate(node)
    } else {
        // 文本不能用_c来处理
        // 有{{}} 普通文本 混合文本（前两者集合）
        const text = node.text
        // 是鬓语法
        if (defaultTagRE.test(text)) {
            let tokens = [] // 混合文本存放
            let match
            let index = 0
            let lastIndex = defaultTagRE.lastIndex = 0 // lastIndex获取匹配后指针的位置，由于上面用过一次test，所以指针不已经不是0开始了，需要重置为0

            while(match = defaultTagRE.exec(text)) {
                index = match.index
                if (index > lastIndex) {
                    tokens.push(JSON.stringify(text.slice(lastIndex, index)))
                }
                tokens.push(`_s(${match[1].trim()})`)
                lastIndex = index + match[0].length
            }

            if (lastIndex < text.length) {
                tokens.push(JSON.stringify(text.slice(lastIndex)))
            }
            return `_v(${tokens.join('+')})`
        } else { // 普通文本
            return `_v(${JSON.stringify(text)})`
        }
    }
}

// 创建元素
export function generate (el) {
    console.log(el)
    let children = genChildren(el)

    // 转换成render代码，这里看不懂需要先移步去学习相关文档：createElement https://cn.vuejs.org/v2/guide/render-function.html
    // _c('div', {id: "app",class: "wrap",style: {"background-color":" pink"}})
    let code = `_c('${el.tag}', ${
        el.attrs.length ? genProps(el.attrs) : 'undefined'
    }${
        children ? ',' + children : ''
    })`

    return code
}
```
处理后的结果：
`_c('div', {id: "app",class: "wrap",style: {"background-color":" pink"}},_c('div', {style: {"color":" red"}},_c('span', {style: {"color":" plum"}},_v(_s(name)))))`

#### 编译成render函数
with：`with`语句用于设置代码在特定对象中的作用域，但该语句运行速度差，且使用不当会引起内存泄漏
new Function: 执行传入的字符串，用于替代eval
需要使用with是因为后面需要向
```diff
// compiler\index.js
+ import { generate } from './generate.js'

export function compileToFunctions (template) {
    // with是动态的插入当前的词法作用域，所以可以在外部将Vue传入，这样就能获取到对应的属性
+   const render = `with(this){return ${code}}`
+   const fn = new Function(render)
+   return fn
}
```
这里可能对到大部分人比较陌生，所以写一个简单的Demo
```
class Test {
    constructor (a, b) {
        this.a = a
        this.b = b
    }
    sum () {
        return this.a + this.b
    }
}

const render = `with(this){return sum()}` // 会去查传入对象中是否存在sum

const res = new Function(render).call(new Test(3, 4)) // new Function执行字符串，并将this指向Test
console.log(res) // 7
```
相关文章：
[JavaScript中 with的用法](https://blog.csdn.net/zwkkkk1/article/details/79725934)
[把字符串当做javascript代码执行](https://blog.csdn.net/a460550542/article/details/79905759)

#### 产生虚拟DOM
虚拟Dom 与 AST语法树 虽然都为对象，但AST语法树描述的是语法本身，也就是不得无中生有。而虚拟Dom是自行定义，用于根据自身需求而指定schema的对象

src下补充三个文件，在index.js引用：
render.js - 拓展 `vue._updata` 方法，用于更新虚拟Dom
lifecycle.js - 拓展 `vue._render` 方法，用于更新真实Dom
observer\watcher.js - 目前步骤，该文件中的watcher仅实现渲染watcher

```diff
// index.js
+ import { lifecycleMixin } from './lifecycle.js'
+ import { renderMixin } from './render.js'

+ lifecycleMixin(Vue) // 扩展 _updata 方法
+ renderMixin(Vue) // 扩展 _render 方法

// init.js
+ import { mountComponent } from './lifecycle.js'

export function initMixin (Vue) {
    Vue.prototype.$mount = function (el) {
+       mountComponent(vm, el) // 组件挂载
    }
}
```

通过混入 renderMixin 和 lifecycleMixin 来拓展Vue的渲染及生命周期（这里暂时只实现生命周期中的渲染方法_update）
```js
// lifecycle.js
import Watcher from './observer/watcher.js'

export function lifecycleMixin (Vue) {
    // 视图更新方法，用于渲染真实DOM
    Vue.prototype._update = function (vnode) {
        
    }
}

export function mountComponent (vm, el) {
    let updateComponent = () => {
        vm._update(vm._render()) // vm._render()返回虚拟节点，update返回真实节点
    }

    // 默认vue是通过watcher来渲染的 渲染watcher（每一个组件都有一个渲染watcher）
    new Watcher(vm, updateComponent, () => {}, true)
}

// render.js
import { createdElement, createTextVnode } from './vdom/index.js'

export function renderMixin (Vue) {
    // 为什么要写在prototype上？因为render中传入this，也就是只能在vue中的方法和变量才能被获取到
    Vue.prototype._c = function (...args) { // 创建元素虚拟节点
        return createdElement(this, ...args)
    }

    Vue.prototype._v = function (text) { // 创建元文本拟节点
        return createTextVnode(this, text)
    }

    Vue.prototype._s = function (value) { // 鬓语法转化成字符串
        // 如果值是个对象，输出成对象字符串，否则输出值
        return value == null ? '' : (typeof value === 'object') ? JSON.stringify(value) : value
    }

    // 用于执行自定义render方法
    Vue.prototype._render = function () {
        const vm = this
        const render = vm.$options.render // 获取编译后的render方法

        // 调用render方法产生虚拟节点
        const vnode = render.call(vm) // 调用时会自动将变量进行取值
        return vnode
    }
}
```

这一步比较简单，就是将render转成虚拟Dom
```js
// vdom\index.js
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
```

#### 生成真实DOM
新建 vdom\patch.js 文件，用于生成真实的节点
```diff
// init.js
export function initMixin (Vue) {
    Vue.prototype.$mount = function (el) {
+       vm.$options.el = el
    }
}
```

```diff
// lifecycle.js
import { patch } from './vdom/patch.js'

export function lifecycleMixin (Vue) {
    // 视图更新方法，用于渲染真实DOM
    Vue.prototype._update = function (vnode) {
        // 首次渲染，需要用虚拟节点，来更新真实的dom元素，后续会改，目前是每次替换都会直接替换掉整个#app
+       vm.$options.el = patch(vm.$options.el, vnode)
    }
}
```
主要代码：
```js
// vdom\patch.js
// 将虚拟节点转换成真实节点
// 将虚拟节点转换成真实节点
export function patch(oldVnode, newVnode) {
    // oldVnode 第一次是一个真实的元素，也就是#app
    const isRealElement = oldVnode.nodeType

    if (isRealElement) {
        // 初次渲染
        const oldElm = oldVnode // id="app"
        const parentElm = oldElm.parentNode
        const el = createdElm(newVnode) // 根据虚拟节点创建真实节点
        // 将创建的节点插入到原有节点的下一个，因为不比vue template，index.html除了入口还可能有其他元素
        parentElm.insertBefore(el, oldElm.nextSibling)
        parentElm.removeChild(oldElm)
        return el // vm.$el
    } else {
        // diff算法

    }
}

function createdElm (vnode) { // 根据虚拟节点创建真实节点，不同于createElement
    let { vm, tag, data, key, children, text } = vnode
    

    if (typeof tag === 'string') {
        // 可能是组件
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
```
<br>

---
手写Vue2核心系列：
[手写Vue2核心（一）： 搭建环境与对象/数组劫持](https://www.jianshu.com/p/7969bc3090ab)
[手写Vue2核心（二）： 模板渲染](https://www.jianshu.com/p/9c0041afdf15)