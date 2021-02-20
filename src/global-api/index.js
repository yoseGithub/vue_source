import { mergeOptions } from "@/util.js"

export function initGlobalAPI (Vue) {
    Vue.options = {} // 用来存储全局的配置

    // filter directive component
    Vue.mixin = function (mixin) {
        this.options = mergeOptions(this.options, mixin)
        return this
    }
}
