import sass from 'rollup-plugin-sass';
import css from "rollup-plugin-import-css";
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
    }),
    css({
      output: 'dist/main.css'
    }),
    // del({ targets: 'types/*' })
  ],
};
const prod = merge(dev, {
  output: {
    file: 'dist/frappe-gantt.min.js',
    sourcemap: false,
  },
  plugins: [
    terser(),
   
  ],
});

const libJs = [
  {
    input: 'node_modules/split-grid/dist/split-grid.min.js',
    output: {
      file: 'dist/split-grid.min.js',
      format: 'iife'
    }
  }
]

export default [dev, prod, ...libJs];
