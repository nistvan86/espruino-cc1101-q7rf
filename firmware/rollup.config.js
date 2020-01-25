import typescript from 'rollup-plugin-typescript'
import { terser } from 'rollup-plugin-terser'

export default {
  input: 'src/app.ts',
  output: {
    file: 'dist/app.js',
    format: 'cjs',
    strict: false
  },
  plugins: [
    typescript(),
    terser()
  ]
}
