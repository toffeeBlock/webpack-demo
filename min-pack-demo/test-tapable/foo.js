const { SyncHook, AsyncSeriesHook, AsyncParallelHook } = require('tapable')

class Person {
  constructor() {
    this.hooks = {
      beforeCreate: new SyncHook(),
      created: new SyncHook(),
      beforeEmit: new AsyncParallelHook(["source"]),
      emited: new AsyncParallelHook(),
    }
  }
  compilerStart() {
    console.log('开始解析啦！！！')
    // 同步
    this.hooks.beforeCreate.call();
  }
  compilerEnd() {
    console.log('解析完成啦！！！')
    // 同步
    this.hooks.created.call();
  }
  emitStart (callback) {
    console.log('发射文件开始啦...')
    // promise 异步
    this.hooks.beforeEmit.callAsync(11, err => {
      callback()
    });
  }
  emitEnd() {
    console.log('发射文件快要结束啦...')
    // this.hooks.enjoyer.call();
    return this.hooks.emited.promise()
  }

  /**
   * 汇编上述方法
   */
  run() {
    this.compilerStart()
    this.compilerEnd()
    this.emitStart(function() {
      console.log('发射文件功能...')
    })
    this.emitEnd()
  }
}

let p = new Person()


p.hooks.beforeCreate.tap('beforeCreate', () => {
  console.log('解析操作......')
})

p.hooks.created.tap('created', () => {
  console.log('完成解析的后续操作')
})


p.hooks.beforeEmit.tapAsync('beforeEmit', (source, callback) => {
  callback()
  console.log('发射文件的回调函数...')
})

p.hooks.emited.tapAsync('emited', () => {
  return new Promise((resolve) => {
    console.log('发射文件结束啦...')
    resolve()
  }).then((resolve) => {
    console.log('发射文件结束后的回调函数...')
  })
})

p.run()
