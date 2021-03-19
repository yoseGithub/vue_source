export default {
    functional: true, // 函数式组件，可以节省性能，但没有实例与没有响应式变化
    name: 'RouterView',
    render (h, { data, parent }) {
        const route = parent.$route // 会做依赖收集了
        let depth = 0

        const records = route.matched // 返回当前路径匹配的所有记录
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
