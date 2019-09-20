const path = require('path')
const fs = require('fs')
const ejs = require('ejs')
// 解析AST语法树
const parser = require('@babel/parser')
// 维护整个AST 树状态，负责替换，删除和添加节点
const traverse = require('@babel/traverse').default
// 将AST转换为代码
const generator = require('@babel/generator').default

const { SyncHook } = require('tapable')

/**
 * Compiler类
 * 主要用于向上递归的查找依赖, 并解析 AST 语法树, 修改所有依赖的 require 为__webpack_require__
 * 利用 fs 模块读取所有的修改后的依赖代码
 * 将每一个模块依赖的相对路径作为键, 该模块代码作为值, 存放到对象中, 用于生成最后的 bundle 文件
 */
class Compiler {
  constructor(config) {
    this.config = config
    this.entry = config.entry
    // root: 执行 min-pack 指令的目录的绝对路径
    this.root = process.cwd()
    this.modules = {}
    this.rules = config.module.rules
    this.hooks = {
      start: new SyncHook(),
      compile: new SyncHook(["relativePath"]),
      afterCompile: new SyncHook(),
      emit: new SyncHook(["filename"]),
      afterEmit: new SyncHook(["outputPath"]),
      done: new SyncHook()
    }

    if(this.isArray(this.config.plugins)) {
      this.config.plugins.forEach(plugin => {
        plugin.apply(this)
      })
    }
  }
  
  /**
   * 打包依赖分析
   * @param {Object} modulePath 当前模块的绝对路径
   */
  depAnalyse(modulePath, relativePath) {

    let self = this

    // 1. 读取模块文件的代码
    let source = this.getSource(modulePath)

    // 2. 将模块代码经过 loader 倒叙迭代编译
    source = this.loaderCompile(source, modulePath)

    // 3. 声明依赖数组, 存储当前模块的所有依赖
    let dependencies = []
    
    // 4. 将当前模块代码转为AST语法
    let ast = this.createAST(source)

    // 5. 修改 AST 语法树
    traverse(ast, {
      CallExpression(p) {
        // 因为 浏览器并不识别 require 这种 commonJS 语法
        // 所以需要将js文件内的 require 全部替换为 __webpack_require__
        if(p.node.callee.name === 'require') {

          p.node.callee.name = '__webpack_require__'

          p.node.arguments[0].value = self.handleRequirePath(p.node.arguments[0].value)
          
          dependencies.push(p.node.arguments[0].value)
        }
      }
    })

    // 6. 将处理好的 AST 语法树转为程序代码
    let resultSourceCode = generator(ast).code

    // 7. 获取 执行打包指令目录的绝对路径 与 当前模块的绝对路径的 相对路径
    let modulePathRelative = this.replaceSlash('./' + path.relative(this.root, modulePath))
    
    // 8. 将 7 中获取到的相对路径为键, 当前模块AST处理后的代码为值, 存储至 this.modules
    this.modules[modulePathRelative] = resultSourceCode

    dependencies.forEach(dep => {
      return this.depAnalyse(path.resolve(this.root, dep), dep)
    })

  }

  /**
   * 倒叙迭代loader, 每一个js(此处仅匹配)文件, 都要经过 loader 编译
   * @param {String} source code
   */
  loaderCompile(source, modulePath) {
    const root = this.root
    function compilation (use, optionObj) {
      let loaderPath = path.join(root, use)
      let loader = require(loaderPath)
      source = loader.call(optionObj, source, optionObj)
      return source
    }
    
    for (let i = 0; i < this.rules.length; i++) {
      // 获取每个rules中的loader路径 || 或 npm包名
      let { test, use } = this.rules[i]
      // 匹配当前模块文件的后缀是否与rules中的 test 正则一致
      if(test.test(modulePath)) {
        if(this.isArray(use)) {
          // 当前的rules为数组
          for (let j = use.length - 1; j >= 0; j--) {
            return compilation(use[j])
            // console.log(`使用${use[j]}----解析${modulePath}`)
          }
        } else if(typeof use === 'string') {
          // 当前的rules为字符串
          return compilation(use)
        } else if(this.isObject(use)) {
          // 当前的rules为对象
          return compilation(use.loader, {query: use.options})
        }
      }
    }
  }

  /**
   * 将生成的 this.modules 与获取模板字符串进行拼接
   */
  emitFile() {
    const templatePath = path.join(__dirname, '../template/output.ejs')
    // 读取模板文件
    let template = this.getSource(templatePath)
    // 进行模板渲染
    let result = ejs.render(template, {
      entry: this.entry,
      modules: this.modules
    })

    // 读取执行打包的配置文件中的output, 将生成好的 result 写入配置output指定文件中
    let outputPath = path.join(this.config.output.path, this.config.output.filename)

    this.hooks.emit.call(this.config.output.filename)

    fs.writeFileSync(outputPath, result)

    this.hooks.afterEmit.call(outputPath)

  }

  start() {
    // 1. 依赖分析
    this.hooks.start.call()
    this.hooks.compile.call()
    this.depAnalyse(path.resolve(this.root, this.entry), this.entry)
    this.hooks.afterCompile.call()
    // 2. 生成最终的打包后的代码
    this.emitFile()
    this.hooks.done.call()
  }

  /**
   * 以下为工具函数 不涉及逻辑
   * 读取文件
   * @param {String}} path 要读取文件的绝对路径
   */
  getSource(path) {
    return fs.readFileSync(path, 'utf-8')
  }

  /**
   * 用于将程序转换为 AST 语法树
   * @param {String} code ECMAScript程序
   */
  createAST(code) {
    return parser.parse(code)
  }

  /**
   * 提取并处理require()中传入的文件路径
   * @param {*} requireContentPath 即为 require('requireContentPath') 中传入的模块路径名
   */
  handleRequirePath(requireContentPath) {
    // 1. 拼接当前 src
    return this.replaceSlash('./' + path.join('src', requireContentPath))
  }

  /**
   * 处理路径中的反斜杠 \
   */
  replaceSlash(path) {
    return path.replace(/\\+/g, '/')
  }

  /**
   * 判断是否为数组
   * @param {Array} arr 
   */
  isArray(arr) {
    return Array.isArray(arr)
  }

  isObject(obj) {
    return obj instanceof Object
  }
}

module.exports = Compiler