export default {
    name: 'RouterLink',
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
