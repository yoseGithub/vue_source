import Vue from 'vue'
import Vuex from '@/vuex'

class VuxPersistence {
    constructor ({ storage }) {
        this.storage = storage
        this.localName = 'VUEX-MY'
    }
    plugin = store => {
        const localState = JSON.parse(this.storage.getItem(this.localName))

        if (localState) {
            console.log('执行')
            store.replaceState(localState)
        }
        store.subscribe((mutationName, state) => {
            this.storage.setItem('VUEX-MY', JSON.stringify(state))
        })
    }
}

const vuexLocal = new VuxPersistence({
    storage: window.localStorage
})

// 由于plugins的用法，所以其插件都必须为高阶函数，通过一个函数返回另一个执行函数
// 默认初始化store时会将plugin中的函数全部执行，传入store，而插件处理逻辑在返回的函数中编写
const logger = store => {
    let prevState = JSON.stringify(store.state)
    // 监听变化，每次数据变化都会执行此方法（也就是执行了commit）
    store.subscribe((mutationName, state) => {
        console.log('prev：' + prevState)
        console.log(mutationName)
        prevState = JSON.stringify(state)
        console.log('next：' + prevState)
    })
}

Vue.use(Vuex) // 自动调用vue.install

export default new Vuex.Store({
    strict: true, // 开启严格模式
    plugins: [
        vuexLocal.plugin
        // logger
    ],
    state: { // data
        name: 'state',
        age: 10
    },
    getters: { // computed
        gettersAge (state) {
            return state.age + 20
        }
    },
    mutations: { // 同步变更
        changeAge (state, payload) {
            state.age = state.age + payload
        }
    },
    actions: {
        changeAge ({ commit }, payload) {
            setTimeout(() => {
                commit('changeAge', payload)
            })
        }
    },
    modules: {
        a: {
            state: {
                name: 'modules-a',
                age: 100
            },
            getters: {
                getName (staste) {
                    return staste.name
                }
            },
            mutations: { // 同步变更
                changeAge (state, payload) {
                    state.age = state.age + payload
                }
            },
            modules: {
                c: {
                    namespaced: true, // 有命名空间
                    state: {
                        name: 'modules-a-c',
                        age: 300
                    },
                    mutations: { // 同步变更
                        asyncChangeAge (state, payload) {
                            state.age = state.age + payload
                        }
                    },
                    actions: {
                        asyncChangeAge ({ commit }, payload) {
                            setTimeout(() => {
                                commit('asyncChangeAge', payload)
                            })
                        }
                    }
                }
            }
        },
        b: { // 没有命名空间，则changeAge方法也会影响到该模块中的state属性值
            namespaced: true, // 有命名空间
            state: {
                name: 'modules-b',
                age: 200
            },
            mutations: { // 同步变更
                changeAge (state, payload) {
                    state.age = state.age + payload
                }
            }
        }
    }
})
