import { initMixin } from './init.js'
import { lifecycleMixin } from './lifecycle.js'
import { renderMixin } from './render.js'
import { initGlobalAPI } from './global-api/index.js'

function Vue (options) {
    this._init(options)
}

initMixin(Vue) // 扩展初始化方法
lifecycleMixin(Vue) // 扩展 _updata 方法
renderMixin(Vue) // 扩展 _render 方法

initGlobalAPI(Vue)

export default Vue