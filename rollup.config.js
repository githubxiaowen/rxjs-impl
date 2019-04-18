import typescript from 'rollup-plugin-typescript';

export default {
  input: './src/index.js',
  output: {
    name: "acha",
    format: "umd",
    file: "dist/acha.js"
  },
  plugins: [
    typescript()
  ]
}
