#!/usr/bin/env node

const path = require('path')

/**
 * 1. 读取项目中的配置文件
 * 2. 运用面向对象思维对项目进行推进
 */

// 注意: 这里使用 path.resolve 来解析工作目录下的 minpack.config.js
const config = require(path.resolve('minpack.config.js'))


const Compiler = require('../lib/Compiler')
new Compiler(config).start()