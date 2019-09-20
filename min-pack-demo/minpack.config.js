const path = require('path')
const HelloWorldPlugins = require('./plugins/HelloWorldPlugins')

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'min-bundle.js',
    path: path.join(__dirname, 'dist')
  },
  module: {
    rules: [
      // {
      //   test: /\.js$/,
      //   use: './loaders/loader1.js'
      // }
      // {
      //   test: /\.js$/,
      //   use: [
      //     './loaders/loader1.js',
      //     './loaders/loader2.js',
      //     './loaders/loader3.js'
      //   ]
      // }
      {
        test: /\.js$/,
        use: {
          loader: './loaders/loader1.js',
          options: {
            name: '星期一'
          }
        }
      }
    ]
  },
  plugins: [
    new HelloWorldPlugins()
  ]
}