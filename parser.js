'use strict'
// Written Docs for this tutorial step can be found here:
// https://github.com/SAP/chevrotain/blob/master/docs/tutorial/step2_parsing.md

// Tutorial Step 2:

// Adding a Parser (grammar only, only reads the input without any actions).
// Using the Token Vocabulary defined in the previous step.

const selectLexer = require('./lexer')
const Parser = require('chevrotain').Parser
const tokenVocabulary = selectLexer.tokenVocabulary

// individual imports, prefer ES6 imports if supported in your runtime/transpiler...
const Select = tokenVocabulary.Select
const From = tokenVocabulary.From
const Where = tokenVocabulary.Where
const OrderBy = tokenVocabulary.OrderBy
const Asc = tokenVocabulary.Asc
const Desc = tokenVocabulary.Desc
const Limit = tokenVocabulary.Limit
const Identifier = tokenVocabulary.Identifier
const Integer = tokenVocabulary.Integer

const GreaterThan = tokenVocabulary.GreaterThan
const GreaterThanEqual = tokenVocabulary.GreaterThanEqual
const LessThan = tokenVocabulary.LessThan
const LessThanEqual = tokenVocabulary.LessThanEqual
const Comma = tokenVocabulary.Comma
const Equal = tokenVocabulary.Equal
const NotEqual = tokenVocabulary.NotEqual

// ----------------- parser -----------------
class SelectParser extends Parser {
  // A config object as a constructor argument is normally not needed.
  // Our tutorial scenario requires a dynamic configuration to support step3 without duplicating code.
  constructor(config) {
    super(tokenVocabulary, config)

    // for conciseness
    const $ = this

    $.RULE('selectStatement', () => {
      $.SUBRULE($.selectClause)
      $.SUBRULE($.fromClause)
      $.OPTION(() => {
        $.SUBRULE($.whereClause)
      })
      $.OPTION1(() => {
        $.SUBRULE($.orderByClause)
      })
      $.OPTION2(() => {
        $.SUBRULE($.limitClause)
      })
    })

    $.RULE('selectClause', () => {
      $.CONSUME(Select)
      $.AT_LEAST_ONE_SEP({
        SEP: Comma,
        DEF: () => {
          $.CONSUME(Identifier)
        },
      })
    })

    $.RULE('fromClause', () => {
      $.CONSUME(From)
      $.CONSUME(Identifier)
    })

    $.RULE('whereClause', () => {
      $.CONSUME(Where)
      $.SUBRULE($.expression)
    })

    $.RULE('orderByClause', () => {
      $.CONSUME(OrderBy)
      $.CONSUME(Identifier)
      $.OPTION(() => {
        $.SUBRULE($.orderByExpression)
      })
    })

    $.RULE('limitClause', () => {
      $.CONSUME(Limit)
      $.CONSUME(Integer)
    })

    // The "rhs" and "lhs" (Right/Left Hand Side) labels will provide easy
    // to use names during CST Visitor (step 3a).
    $.RULE('expression', () => {
      $.SUBRULE($.atomicExpression, { LABEL: 'lhs' })
      $.SUBRULE($.relationalOperator)
      $.SUBRULE2($.atomicExpression, { LABEL: 'rhs' }) // note the '2' suffix to distinguish
      // from the 'SUBRULE(atomicExpression)'
      // 2 lines above.
    })

    $.RULE('atomicExpression', () => {
      $.OR([
        { ALT: () => $.CONSUME(Integer) },
        { ALT: () => $.CONSUME(Identifier) },
      ])
    })

    $.RULE('orderByExpression', () => {
      $.OR([{ ALT: () => $.CONSUME(Asc) }, { ALT: () => $.CONSUME(Desc) }])
    })

    $.RULE('relationalOperator', () => {
      $.OR([
        { ALT: () => $.CONSUME(GreaterThanEqual) },
        { ALT: () => $.CONSUME(LessThanEqual) },
        { ALT: () => $.CONSUME(GreaterThan) },
        { ALT: () => $.CONSUME(LessThan) },
        { ALT: () => $.CONSUME(Equal) },
        { ALT: () => $.CONSUME(NotEqual) },
      ])
    })

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    this.performSelfAnalysis()
  }
}

// We only ever need one as the parser internal state is reset for each new input.
const parserInstance = new SelectParser()

module.exports = {
  parserInstance: parserInstance,

  SelectParser: SelectParser,

  parse: function(inputText) {
    const lexResult = selectLexer.lex(inputText)

    // ".input" is a setter which will reset the parser's internal's state.
    parserInstance.input = lexResult.tokens

    // No semantic actions so this won't return anything yet.
    parserInstance.selectStatement()

    if (parserInstance.errors.length > 0) {
      throw Error(
        'Parsing errors detected!\n' + parserInstance.errors[0].message
      )
    }
  },
}
