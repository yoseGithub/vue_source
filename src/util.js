// 因为工具方法不多，所以没像源码那样再建一个文件夹，源码：src\core\util，具体看next-tick.js ，这里只说实现原理，不会写那么多兼容
let callbacks = []
// 由于批处理的时候会执行nextTick，用户也可能会去调用nextTick，会导致重复执行，因此需要将所有调用nextTick的逻辑都先锁上，等到全部处理完再放开
let waiting = false

export const isObject = val => typeof val === 'object' && val !== null

function flushCallbacks () {
    for (let i = 0; i < callbacks.length; i++) {
        let callback = callbacks[i]
        callback()
    }
    waiting = false
    callbacks = []
}

// 批量处理，第一次开定时器，后续只更新列表，之后执行清空逻辑
// 第一次cb是渲染watcher更新操作（渲染watcher执行的过程是同步的）
// 第二次cb是用户传入的回调
export function nextTick(cb) {
    callbacks.push(cb)

    // 1. Promise
    // 2. mutationObserver
    // 3. setImmdiate
    // 4. setTimeout
    // 由于 vue3 已不再考虑兼容性，里面直接用的 Promise，所以这里就不重现了，有兴趣自行看源码
    if (!waiting) {
        waiting = true
        Promise.resolve().then(flushCallbacks) // 多次调用nextTick，只会开启一次Promise
    }
}

// 没全写，主要是实现合并原理
const LIFECYCLE_HOOKS = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted'
]

const strats = {}
LIFECYCLE_HOOKS.forEach(hook => {
    strats[hook] = mergeHook
})


// 钩子合并策略，数组形式
function mergeHook (parentVal, childVal) {
    if (childVal) {
        if (parentVal) {
            // 如果儿子有父亲也有
            return parentVal.concat(childVal)
        } else {
            // 如果儿子有父亲没有
            return [childVal]
        }
    } else {
        return parentVal // 儿子没有直接采用父亲
    }
}

// 合并策略，属性采用对象合并（Object.assgin规则），生命周期则包装成数组，后面依次执行
export function mergeOptions (parent, child) {
    const options = {}
    // 如果父亲有儿子也有，应该用儿子替换父亲；如果父亲有值儿子没有，用父亲的
    // {a: 1} {a: 2} => {a: 2}
    // {a: 1} {b: 2} => {a:1, b: 2}

    // 使用for，主要考虑到深拷贝
    for (let key in parent) {
        mergeField(key)
    }

    for (let key in child) {
        if (!parent.hasOwnProperty(key)) {
            mergeField(key)
        }
    }

    // vue这种做法，老是在函数中写函数我也是醉了…
    function mergeField (key) {
        // 策略模式，生命周期合并处理
        if (strats[key]) {
            return options[key] = strats[key](parent[key], child[key]) // 这里相当于调用mergeHook，因为没完全实现（比如components等那些合并策略并没有实现）
        }
    
        // data属性的合并处理
        if (isObject(parent[key]) && isObject(child[key])) {
            options[key] = {...parent[key], ...child[key]}
        } else {
            if (child[key]) { // 如果儿子有值
                options[key] = child[key]
            } else {
                options[key] = parent[key]
            }
        }
    }

    console.log(options)
    return options
}