'use strict'
// Written Docs for this tutorial step can be found here:
// https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step3a_adding_actions_separated.md

// Tutorial Step 3a:

// Adding Actions(semantics) to our grammar using a CST Visitor.

const selectLexer = require('./lexer')
// re-using the parser implemented in step two.
const parser = require('./parser')
const SelectParser = parser.SelectParser

// A new parser instance with CST output (enabled by default).
const parserInstance = new SelectParser([])
// The base visitor class can be accessed via the a parser instance.
const BaseSQLVisitor = parserInstance.getBaseCstVisitorConstructor()

class SQLToAstVisitor extends BaseSQLVisitor {
  constructor() {
    super()
    this.validateVisitor()
  }

  selectStatement(ctx) {
    // "this.visit" can be used to visit none-terminals and will invoke the correct visit method for the CstNode passed.
    const select = this.visit(ctx.selectClause)

    //  "this.visit" can work on either a CstNode or an Array of CstNodes.
    //  If an array is passed (ctx.fromClause is an array) it is equivalent
    //  to passing the first element of that array
    const from = this.visit(ctx.fromClause)

    // "whereClause" is optional, "this.visit" will ignore empty arrays (optional)
    const where = this.visit(ctx.whereClause)

    // "orderByClause" is optional, "this.visit" will ignore empty arrays (optional)
    const orderBy = this.visit(ctx.orderByClause)

    // "limitClause" is optional, "this.visit" will ignore empty arrays (optional)
    const limit = this.visit(ctx.limitClause)

    return {
      type: 'SELECT_STMT',
      selectClause: select,
      fromClause: from,
      whereClause: where,
      orderByClause: orderBy,
      limitClause: limit
    }
  }

  selectClause(ctx) {
    // Each Terminal or Non-Terminal in a grammar rule are collected into
    // an array with the same name(key) in the ctx object.
    if(ctx.Identifier) {
      const columns = ctx.Identifier.map(identToken => identToken.image)

      return {
        type: 'SELECT_CLAUSE',
        columns: columns,
        minMax: minmax
      }
    } else {
       const column = ctx.minMaxExpression[0].children.Identifier[0].image
       const minMax = this.visit(ctx.minMaxExpression)
      return {
        type: 'SELECT_CLAUSE',
        columns: [column], // return an array for consistency
        minMax: minMax
      }
    }
  }

  fromClause(ctx) {
    const tableName = ctx.Identifier[0].image

    return {
      type: 'FROM_CLAUSE',
      table: tableName,
    }
  }

  whereClause(ctx) {
    const condition = this.visit(ctx.expression)

    return {
      type: 'WHERE_CLAUSE',
      condition: condition,
    }
  }

  orderByClause(ctx) {
    const expression = ctx.Identifier[0].image
    const condition = this.visit(ctx.orderByExpression) || 'ASC'
    return {
      type: 'ORDERBY_CLAUSE',
      expression: expression,
      condition: condition,
    }
  }

  limitClause(ctx) {
    const limit = parseInt(ctx.Integer[0].image, 10)
    return {
      type: 'LIMIT_CLAUSE',
      limit: limit,
    }
  }

  orderByExpression(ctx) {
    if (ctx.Desc) {
      return ctx.Desc[0].image
    }
    return ctx.Asc[0].image
  }

  minMaxExpression(ctx) {
    if(ctx.Min) {
      return ctx.Min[0].image
    }
    return ctx.Max[0].image
  }

  expression(ctx) {
    // Note the usage of the "rhs" and "lhs" labels defined in step 2 in the expression rule.
    const lhs = this.visit(ctx.lhs[0])
    const operator = this.visit(ctx.relationalOperator)
    const rhs = this.visit(ctx.rhs[0])

    return {
      type: 'EXPRESSION',
      lhs: lhs,
      operator: operator,
      rhs: rhs,
    }
  }

  // these two visitor methods will return a string.
  atomicExpression(ctx) {
    if (ctx.Integer) {
      return parseInt(ctx.Integer[0].image, 10)
    } else {
      return ctx.Identifier[0].image
    }
  }

  relationalOperator(ctx) {
    if (ctx.GreaterThanEqual) {
      return ctx.GreaterThanEqual[0].image
    } else if (ctx.GreaterThan) {
      return ctx.GreaterThan[0].image
    } else if (ctx.LessThanEqual) {
      return ctx.LessThanEqual[0].image
    } else if (ctx.LessThan) {
      return ctx.LessThan[0].image
    } else if (ctx.Equal) {
      return ctx.Equal[0].image
    } else if (ctx.NotEqual) {
      return ctx.NotEqual[0].image
    }
  }
}

// Our visitor has no state, so a single instance is sufficient.
const toAstVisitorInstance = new SQLToAstVisitor()

module.exports = {
  toAst: function(inputText) {
    const lexResult = selectLexer.lex(inputText)

    // ".input" is a setter which will reset the parser's internal's state.
    parserInstance.input = lexResult.tokens

    // Automatic CST created when parsing
    const cst = parserInstance.selectStatement()

    if (parserInstance.errors.length > 0) {
      throw Error(
        'Parsing errors detected!\n' + parserInstance.errors[0].message
      )
    }

    const ast = toAstVisitorInstance.visit(cst)

    return ast
  },
}
