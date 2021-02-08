// 匹配出html字符串，根据标签创建输出render字符串函数
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g

function genProps (attrs) {
    let str = ''
    for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i]

        // 如果有行内样式，例如 style="color: red"
        if (attr.name === 'style') {
            let obj = {}
            attr.value.split(';').forEach(item => {
                let [key, value] = item.split(':')
                obj[key] = value
            })
            attr.value = obj
        }

        // 由于字符串拼接，attr.value 会丢失 双引号（或单引号），{id: app}，这样待会解析就变成变量了
        // 所以需要使用JSON.stringify重新将字符串补充上引号 {id: "app"}
        str += `${attr.name}: ${JSON.stringify(attr.value)},` // _c('div', {id: "app",class: "wrap",style: {"background-color":" pink"}})
    }

    return `{${str.slice(0, -1)}}` // 去除最后多余的逗号
}

function genChildren(el) {
    const children = el.children
    if (children) {
        return children.map(child => gen(child)).join(',')
    }
}

// 区分是元素还是文本
function gen(node) {
    if (node.type === 1) {
        return generate(node)
    } else {
        // 文本不能用_c来处理
        // 有{{}} 普通文本 混合文本（前两者集合）
        const text = node.text
        // 是鬓语法
        if (defaultTagRE.test(text)) {
            let tokens = [] // 混合文本存放
            let match
            let index = 0
            let lastIndex = defaultTagRE.lastIndex = 0 // lastIndex获取匹配后指针的位置，由于上面用过一次test，所以指针不已经不是0开始了，需要重置为0

            while(match = defaultTagRE.exec(text)) {
                index = match.index
                if (index > lastIndex) {
                    tokens.push(JSON.stringify(text.slice(lastIndex, index)))
                }
                tokens.push(`_s(${match[1].trim()})`)
                lastIndex = index + match[0].length
            }

            if (lastIndex < text.length) {
                tokens.push(JSON.stringify(text.slice(lastIndex)))
            }
            return `_v(${tokens.join('+')})`
        } else { // 普通文本
            return `_v(${JSON.stringify(text)})`
        }
    }
}

// 创建元素
export function generate (el) {
    let children = genChildren(el)

    // 转换成render代码，这里看不懂需要先移步去学习相关文档：createElement https://cn.vuejs.org/v2/guide/render-function.html
    // _c('div', {id: "app",class: "wrap",style: {"background-color":" pink"}})
    let code = `_c('${el.tag}', ${
        el.attrs.length ? genProps(el.attrs) : 'undefined'
    }${
        children ? ',' + children : ''
    })`

    return code
}
