// 调度文件
import { nextTick } from "@/util.js"
import { watch } from "_rollup@2.38.4@rollup"

// let watcherIds = new Set() // 源码用的对象，不知道为什么前面 depsId 用 set ，这里去重却用了对象 has
let has = {}
let queue = []
let pending = false

function flushSchedularQueue () {
    for (let i = 0; i < queue.length; i++) {
        let watcher = queue[i]
        watcher.run()

        if (!watcher.user) {
            watcher.cb()
        }
    }
    // watcherIds.clear()
    has = {}
    queue = []
    pending = false
}

// 调度更新，同一个watcher只会触发一次 watcher.run()
export function queueWatcher (watcher) {
    // 更新时对watcher进行去重操作
    const id = watcher.id
    // if (!watcherIds.has(id))
    if (has[id] == null) {
        queue.push(watcher)
        // watcherIds.add(id)
        has[id] = true

        // 让queue清空，加锁pending，不同 watcher 只触发一次nextTick更新
        if (!pending) {
            pending = true
            nextTick(flushSchedularQueue)
        }
    }
}