// 因为工具方法不多，所以没像源码那样再建一个文件夹，源码：src\core\util，具体看next-tick.js ，这里只说实现原理，不会写那么多兼容
let callbacks = []
// 由于批处理的时候会执行nextTick，用户也可能会去调用nextTick，会导致重复执行，因此需要将所有调用nextTick的逻辑都先锁上，等到全部处理完再放开
let waiting = false

function flushCallbacks () {
    console.log('产生异步任务')
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