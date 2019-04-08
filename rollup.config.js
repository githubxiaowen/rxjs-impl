import typescript from 'rollup-plugin-typescript';

export default {
  input: './src/index.js',
  output: {
    name: "bjs",
    format: "umd",
    file: "dist/bjs.js"
  },
  plugins: [
    typescript()
  ]
}
