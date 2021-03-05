import { initMixin } from './init.js'
import { lifecycleMixin } from './lifecycle.js'
import { renderMixin } from './render.js'
import { initGlobalAPI } from './global-api/index.js'

// import { compileToFunctions } from './compiler/index.js'
// import { createElm, patch } from './vdom/patch.js'

function Vue (options) {
    this._init(options)
}

initMixin(Vue) // 扩展初始化方法
lifecycleMixin(Vue) // 扩展 _updata 方法
renderMixin(Vue) // 扩展 _render 方法

initGlobalAPI(Vue)

// // 构建两个虚拟Dom
// let vm1 = new Vue({
//     data () {
//         return {
//             name: 'yose'
//         }
//     }
// })

// let render1 = compileToFunctions(`<ul>
//     <li key="A" style="color: #167201">A</li>
//     <li key="B" style="color: #2b4acd">B</li>
//     <li key="C" style="color: #5300c8">C</li>
//     <li key="D" style="color: #f41037">D</li>
//     <li key="F" style="color: #8c6b8a">F</li>
// </ul>`) // 将模板变为render函数
// let oldVnode = render1.call(vm1) // 老的虚拟节点
// let el = createElm(oldVnode) // 创建真实节点
// document.body.appendChild(el)

// let vm2 = new Vue({
//     data () {
//         return {
//             name: 'Catherine'
//         }
//     }
// })

// let render2 = compileToFunctions(`<ul>
//     <li key="N" style="color: #6cca8f">N</li>
//     <li key="A" style="color: #167201">A</li>
//     <li key="C" style="color: #5300c8">C</li>
//     <li key="B" style="color: #2b4acd">B</li>
//     <li key="E" style="color: #f41037">E</li>
// </ul>`) // 将模板变为render函数
// let newVnode = render2.call(vm2) // 老的虚拟节点

// setTimeout(() => {
//     patch(oldVnode, newVnode)
// }, 2000)

export default Vue