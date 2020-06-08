import {terser} from 'rollup-plugin-terser';

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
    ]
};

export {config as default};
