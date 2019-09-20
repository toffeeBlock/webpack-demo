module.exports = class HelloWorldPlugins {
  apply(compiler) {
    compiler.hooks.start.tap('HelloWorldPlugin', () => {
      console.log('webpack开始编译')
    });
    compiler.hooks.compile.tap('HelloWorldPlugin', () => {
      console.log('编译中')
    });
    compiler.hooks.afterCompile.tap('HelloWorldPlugin', () => {
      console.log('webpack编译结束')
    });
    compiler.hooks.emit.tap('HelloWorldPlugin', (filename) => {
      console.log('开始打包文件，文件名为： ', filename)
    });
    compiler.hooks.afterEmit.tap('HelloWorldPlugin', (path) => {
      console.log('文件打包结束，打包后文件路径为： ', path)
    });
    compiler.hooks.done.tap('HelloWorldPlugin', () => {
      console.log('webpack打包结束')
    })
  }
}
