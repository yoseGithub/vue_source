// 生成路由映射表，支持动态加载路由
export default function createRouteMap (routes, oldPathMap) {
    // 一个参数是初始化，两个参数是动态添加路由
    const pathMap = oldPathMap || {}

    routes.forEach(route => {
        addRouteRecord(route, pathMap, null)
    })

    return {
        pathMap
    }
}

// 填充路由，生成路由对象
function addRouteRecord (route, pathMap, parent) { // pathMap = {路径: 记录}
    // 要判断儿子的路径不是以 / 开头的，否则不拼接父路径
    const path = route.path.startsWith('/') ? route.path : parent ? parent.path + '/' + route.path : route.path
    const record = {
        path,
        parent, // 父记录
        component: route.component,
        name: route.name,
        props: route.props,
        params: route.params || {},
        meta: route.meta
    }

    // 判断是否存在路由记录，没有则添加
    if (!pathMap[path]) {
        pathMap[path] = record
    }

    if (route.children) {
        // 递归，没有孩子就停止遍历
        route.children.forEach(childRoute => {
            addRouteRecord(childRoute, pathMap, record)
        })
    }
}
