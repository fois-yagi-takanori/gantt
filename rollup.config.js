import sass from 'rollup-plugin-sass';
import { terser } from 'rollup-plugin-terser';
import merge from 'deepmerge';
import typescript from '@rollup/plugin-typescript';
import del from 'rollup-plugin-delete'

const dev = {
  input: 'src/index.ts',
  output: {
    name: 'Gantt',
    file: 'dist/frappe-gantt.js',
    format: 'iife',
    sourcemap: true,
  },
  plugins: [
    typescript(),
    sass({
      output: 'dist/frappe-gantt.css',
    })
  ],
};
const prod = merge(dev, {
  output: {
    file: 'dist/frappe-gantt.min.js',
    sourcemap: false,
  },
  plugins: [
    terser(),
    del({ targets: 'dist/*' })
  ],
});

export default [dev, prod];
