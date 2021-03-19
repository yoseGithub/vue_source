// 根据路径，返回该路径所需的所有记录
export function createRoute (record, location) {
    const res = []

    if (record) {
        while (record) { // 二级菜单及N级菜单，将对应的菜单一个个往栈中加
            res.unshift(record)
            record = record.parent
        }
    }

    return {
        ...location,
        matched: res
    }
}

function runQueue (queue, interator, cb) {
    function next (index) {
        if (index >= queue.length) {
            return cb() // 一个钩子都没有，或者钩子全部执行完毕，直接调用cb完成渲染即可
        } else {
            const hook = queue[index]
            interator(hook, () => next(index + 1))
        }
    }

    next(0)
}

export default class History {
    constructor (router) {
        this.router = router
        // 最终核心需要将current属性变化成响应式的，后续current变化会更新视图
        this.current = createRoute(null, {
            path: '/'
        })
    }
    // 根据路径进行组件渲染，数据变化更新视图
    transitionTo (location, onComplete) { // 默认会先执行一次
        // 根据跳转的路径，获取匹配的记录
        const route = this.router.match(location)

        const queue = [].concat(this.router.beforeEachHooks)

        // 迭代器
        const interator = (hook, cb) => { // 这里如果用function来声明，this则为undefined，因为构建后是严格模式
            hook(route, this.current, cb) // to, from, next
        }

        runQueue(queue, interator, () => {
            this.current = route
            // 由于由响应式变换的是_route（install中进行的响应式定义），而更改的是this.current，无法触发响应式
            // vueRoute用于提供给用户直接使用，vueRoute中又需要对历史记录进行操作
            // 跳转的时候又是由历史记录所触发，需要通知变更vue._route，而现在变更的是历史记录中的current
            // 需要将自身变更后匹配到的路由返回给vueRouter，这里不能直接使用 install导出的_vue
            // 是因为考虑到有可能实例化了多个Vue，这个时候的_Vue是最后实例化的Vue，并非对应vueRouter所使用的Vue实例
            // 通过listen去执行vueRouter绑定的函数，vueRouter中有当前Vue实例，就能将当前匹配到的路由赋值给Vue._route，这样就能触发响应式变化

            this.cb && this.cb(route) // 第一次cb不存在，还未进行绑定回调，cb调用触发视图更新
            onComplete && onComplete() // cb调用hash值变化会再次调用transitionTo
        })
    }
    listen (cb) {
        this.cb = cb
    }
}
