// import {terser} from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';

const config = {
    input: 'sources/main.js',
    output: [
        // {
        //     format: 'es',
        //     file: 'builds/es6.min.sever.js',
        //     plugins: [terser()]
        // },
        {
            format: 'es',
            file: 'builds/es6.sever.js'
        },
        {
            format: 'cjs',
            file: 'builds/cjs.sever.js'
        }
    ],
    plugins: [
        copy({targets: [{src: 'sources/types.d.ts', dest: 'builds', rename: 'sever.d.ts'}]})
    ]
};

export {config as default};
