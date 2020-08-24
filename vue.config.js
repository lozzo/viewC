// eslint-disable-next-line @typescript-eslint/no-var-requires
const CopyWebpackPlugin = require('copy-webpack-plugin')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack')
module.exports = {
  filenameHashing: false,
  productionSourceMap: false,
  pages: {
    ctlPage: {
      entry: 'src/ctlPage/main.ts',
      filename: 'ctlPage/index.html'
    },
    popup: {
      entry: 'src/popup/main.ts',
      filename: 'popup/popup.html'
    },
    devtools: {
      entry: 'src/devtools/initDevtools.ts',
      filename: 'devtools/initDevtools.html'
    }
  },
  configureWebpack: {
    entry: {
      background: './src/background/background.ts',
      contentjs: './src/contentInject/contentjs.ts'
    },
    output: {
      filename: 'js/[name].js'
    },
    plugins: [
      new CopyWebpackPlugin([{
        from: './src/manifest.json',
        to: 'manifest.json'
      }]),
      new webpack.DefinePlugin({
        global: 'window'
      })
    ]
  },
  // 这儿删除不要生成chunk-vendors.js
  chainWebpack: (config) => {
    config.optimization.delete('splitChunks')
    config.performance.maxEntrypointSize(4000000).maxAssetSize(4000000)
  }
}