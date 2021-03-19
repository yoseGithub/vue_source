import createRouteMap from './create-route-map'
import { createRoute } from './history/base.js'

// 匹配器
export default function createMather (routes) {
    const { pathMap } = createRouteMap(routes) // 根据用户的路由配置创建一个映射表

    // 动态添加路由权限，已废弃，现在只剩addRoute
    function addRoutes (routes) {
        createRouteMap(routes, pathMap) // 实现动态路由
    }

    // 根据提供的路径匹配路由
    function match (path) {
        const record = pathMap[path]

        return createRoute(record, {
            path
        })
    }

    return {
        addRoutes,
        match
    }
}
