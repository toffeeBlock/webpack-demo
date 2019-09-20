(function(modules) {

  function __webpack_require__(moduleId) {

    const module = {
      i: moduleId,
      l: false,
      exports: {}
    }

    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__)

    return module.exports

  }

  return __webpack_require__(__webpack_require__.s = "./src/index.js")

})({
  
    './src/index.js':
    (
      function(module, exports, __webpack_require__) {
        eval(`const ticket = __webpack_require__("./src/ticket.js");

console.log('迪斯尼门票甩卖，' + ticket);`)
      }
    ),
  
    './src/ticket.js':
    (
      function(module, exports, __webpack_require__) {
        eval(`const price = __webpack_require__("./src/price.js");

module.exports = '门票价格为' + price.content;`)
      }
    ),
  
    './src/price.js':
    (
      function(module, exports, __webpack_require__) {
        eval(`module.exports = {
  content: '299人民币/人'
};`)
      }
    ),
  
})