// 该文件逻辑参考 vue-router 的 install
function vueInit () {
    if (this.$options.store) {
        this.$store = this.$options.store // 给根属性增加 $store 属性
    } else if (this.$parent && this.$parent.$store) {
        this.$store = this.$parent.$store
    }
}

export const applyMixin = (Vue) => {
    Vue.mixin({
        beforeCreate: vueInit
    })
}
