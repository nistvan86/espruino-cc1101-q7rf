import generateHtml from 'rollup-plugin-generate-html'
import typescript from 'rollup-plugin-typescript'
import nodeResolve from 'rollup-plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

export default {
  input: 'src/index.ts',
  plugins: [
    typescript(),
    nodeResolve(),
    terser(),
    generateHtml({
      filename: 'dist/index.html',
      template: 'src/index.html',
      inline: true
    })
  ]
}
