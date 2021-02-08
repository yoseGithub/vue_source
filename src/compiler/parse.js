// 生成AST语法树
// 直接从github上源码搬运过来的正则 https://github.com/vuejs/vue/blob/edf7df0c837557dd3ea8d7b42ad8d4b21858ade0/packages/vue-template-compiler/build.js#L270
const ncname = '[a-zA-Z_][\\w\\-\\.]*' // 匹配标签名
const qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")" // 匹配带前缀的标签名 <aa:span>，有命名空间的标签
const startTagOpen = new RegExp(("^<" + qnameCapture))
const endTag = new RegExp(("^<\\/" + qnameCapture + "[^>]*>"))
// 例如 style     =     "xxx" 或 style="xxx" 或 style='xxx' 或 style=xxx
// 这里估计版本有更改，如果不需要捕获=号，则改成/^\s*([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
const startTagClose = /^\s*(\/?)>/

// 解析未处理的剩余html（处理完则前进，仅保留尚未处理的html，直到完全处理完）
export function parseHTML (html) {
    // vue3里面支持多个根元素（外层加了一个空元素），vue2中只有一个根节点
    function createASTElment (tag, attrs) {
        return {
            tag, // 标签
            type: 1, // 元素类型，1为节点，3为文本
            children: [], // 子节点
            attrs, // 属性
            parent: null // 父节点
        }
    }

    let root = null
    let currentParent // 当前处理的节点
    let stack = [] // 栈

    // 根据开始标签、结束标签、文本内容，生成AST语法书
    function start (tagName, attrs) {
        let element = createASTElment(tagName, attrs)
        // 创建树根
        if (!root) {
            root = element
        }
        currentParent = element
        stack.push(element)
    }

    // 栈处理，这里没写异常处理，可以判断标签是否正常闭合，是否有多余标签等
    function end (tagName) {
        let element = stack.pop()
        currentParent = stack[stack.length - 1]
        // 双指针（父子互相记录）
        if (currentParent) {
            element.parent = currentParent
            currentParent.children.push(element)

        }
    }

    
    function chars (text) {
        text = text.replace(/\s/g, '') // 去除空格，源码是更改为一个空格，这里为了好判断直接全部去掉
        if (text) {
            currentParent.children.push({
                type: 3,
                text
            })
        }
    }

    // 前进，为了减少解析，需要在解析后则删除掉（前进一段）
    function advance (n) {
        html = html.substring(n)
    }

    // 解析起始标签
    function parseStartTag () {
        const start = html.match(startTagOpen)
        if (start) {
            let match = {
                tagName: start[1],
                attrs: []
            }

            advance(start[0].length) // 截取至<div

            // 查找属性
            let end, attr
            // 不是开头标签结尾并且有属性值
            // !(end = html.match(startTagClose) 这里是赋值跟返回放在一起，相当于先赋值end = html.match(startTagClose，再判断end
            while(!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                advance(attr[0].length)

                match.attrs.push({
                    name: attr[1],
                    value: attr[3] || attr[4] || attr[5] || true // 可能是 a="1" a='1' a=1，都没有则为true，比如 disabled 等同于 disabled="true"
                })
            }

            if (end) {
                advance(end[0].length)
                return match
            }
        }
    }

    while (html) {
        let textEnd = html.indexOf('<')
        // 匹配的 < 号有可能是开始标签，也可能是结束标签
        if (textEnd === 0) {
            // 开始标签
            let startTagMatch = parseStartTag(html)
            if (startTagMatch) {
                start(startTagMatch.tagName, startTagMatch.attrs)
                continue
            }
            
            // 结束标签，不需要解析获取，只用于前进即可
            let endTagMatch = html.match(endTag)
            if (endTagMatch) {
                advance(endTagMatch[0].length)
                end(endTagMatch[1])
                continue
            }
        }

        let text
        if (textEnd > 0) { // 开始解析文本(有可能是文本，也可能是标签换行留下的空白)
            text = html.substring(0, textEnd)
        }

        if (text) {
            advance(text.length)
            chars(text)
        }
    }

    return root
}