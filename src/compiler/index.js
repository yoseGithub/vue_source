// 用于执行 render 字符串
import { parseHTML } from './parse.js'
import { generate } from './generate.js'

export function compileToFunctions (template) {
    const ast = parseHTML(template)

    // 源码中还会标记静态节点，转成js语法
    const code = generate(ast) // 生成代码

    // 不同于eval,with是动态的插入当前的词法作用域，所以可以在外部将Vue传入，这样就能获取到对应的属性
    const render = `with(this){return ${code}}`
    const fn = new Function(render)
    return fn
}
