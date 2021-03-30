import { forEachValue } from '../util'
import Module from './module'

// 将传入的store转成树型结构 _row为该模块键值，_children为该模块modules中的键值（也转为树形结构），_state为该模块中写的state，深度优先
export default class ModuleCollection {
    constructor (options) { // 遍历用户的属性对数据进行格式化操作
        this.root = null
        this.register([], options)
    }
    getNamespace (path) {
        let module = this.root
        return path.reduce((namespaced, key) => {
            module = module.getChild(key)
            // 如果父模块没有namespaced，子模块有，那么调用的时候就只需要写子模块，比如 c/ 否则就是a/c/，第一个root必然为空
            return namespaced + (module.namespaced ? key + '/' : '')
        }, '')
    }
    register (path, rootModule) {
        const newModule = new Module(rootModule)

        if (path.length === 0) { // 初始化
            this.root = newModule
        } else {
            // 将当前模块定义在父亲身上
            const parent = path.slice(0, -1).reduce((memo, current) => {
                return memo.getChild(current)
            }, this.root)

            parent.addChild(path[path.length - 1], newModule)
        }

        // 如果还有modules就继续递归
        if (rootModule.modules) {
            forEachValue(rootModule.modules, (module, moduleName) => {
                this.register(path.concat(moduleName), module)
            })
        }
    }
}

