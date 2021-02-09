import serve from 'rollup-plugin-serve'
import babel from '@rollup/plugin-babel'
import alias from 'rollup-plugin-alias';

// 用于打包的配置
export default {
    input: './src/index.js',
    output: {
        file: 'dist/vue.js',
        name: 'Vue', // 全局名字就是vue
        format: 'umd', // window.Vue
        sourcemap: true // es6->es5
    },
    alias: {
        '@': './src/*'
    },
    plugins: [
        alias({
            resolve: ['.jsx', '.js'],
            entries:[
              {find: '@', replacement: './src'}
            ]
        }),
        babel({
            exclude: 'node_modules/**' // 该目录不需要用babel转换
        }),
        serve({
            open: true,
            openPage: '/public/index.html',
            port: 3000,
            contentBase: '' // 指定根目录
        })
    ]
}