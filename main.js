const toAstVisitor = require('./cst-visitor').toAst

const parse = (str) => {
  const astFromVisitor = toAstVisitor(str)
  return astFromVisitor
}

module.exports = parse