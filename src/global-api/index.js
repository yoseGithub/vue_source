import { mergeOptions } from "@/util.js"

export function initGlobalAPI (Vue) {
    Vue.options = {} // 用来存储全局的配置

    // filter directive component
    Vue.mixin = function (mixin) {
        this.options = mergeOptions(this.options, mixin)
        return this
    }

    // 调用生成组件
    Vue.options._base = Vue // 永远指向Vue的构造函数
    Vue.options.components = {} // 用来存放组件的定义
    Vue.component = function (id, definition) {
        definition.name = definition.name || id // 组件名，如果定义中有name属性则使用name，否则以组件名命名
        definition = this.options._base.extend(definition) // 通过对象产生一个构造函数
        this.options.components[id] = definition
    }

    let cid = 0
    // 子组件初始化时，会 new VueComponent(options)，产生一个子类Sub
    Vue.extend = function (options) {
        const Super = this // Vue构造函数，此时还未被实例化
        const Sub = function VueComponent (options) {
            this._init(options)
        }

        Sub.cid = cid++ // 防止组件是同一个构造函数产生的，因为不同组件可能命名却是一样，会导致createComponent中出问题
        Sub.prototype = Object.create(Super.prototype) // 都是通过Vue来继承的
        Sub.prototype.constructor = Sub // 常规操作，原型变更，将实例所指向的原函数也改掉，这样静态属性也会被同步过来
        // 注意这一步不是在替换$options.component，而是在将Vue.component方法进行统一，都是使用的上面那个Vue.component = function (id, definition)函数
        Sub.component = Super.component
        // ...省略其余操作代码
        Sub.options = mergeOptions(Super.options, options) // 将全局组件与该实例化的组件options合并（注意之前的实现，只会合并属性与生命周期）
        return Sub // 这个构造函数是由对象（options）产生而来的
    }
}
