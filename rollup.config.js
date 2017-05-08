import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
export default {
    entry: 'src/jquery.form.js',
    format: 'umd',
    moduleName:'Form',
    plugins: [ resolve({
        customResolveOptions: {
            moduleDirectory: 'node_modules'
        }
    }) ,babel({
        exclude: 'node_modules/**' // only transpile our source code
    })],
    //globals:{},
    external: ['lodash','jquery'],
    sourceMap: true,
    dest: 'dist/jquery.form.js' // equivalent to --output
};