import { forEachValue } from '../util'

export default class Module {
    constructor (rawModule) {
        this._raw = rawModule
        this._children = {}
        this.state = rawModule.state
    }
    get namespaced () {
        return !!this._raw.namespaced
    }
    getChild (key) { // 获取子节点中的某一个
        return this._children[key]
    }
    addChild (key, module) { // 添加子节点
        this._children[key] = module
    }
    forEachMutation (fn) {
        if (this._raw.mutations) {
            forEachValue(this._raw.mutations, fn)
        }
    }
    forEachAction (fn) {
        if (this._raw.actions) {
            forEachValue(this._raw.actions, fn)
        }
    }
    forEachGetters (fn) {
        if (this._raw.getters) {
            forEachValue(this._raw.getters, fn)
        }
    }
    forEachChildren (fn) {
        forEachValue(this._children, fn)
    }
}
