'use strict'

const { createToken, Lexer } = require('chevrotain')

// the vocabulary will be exported and used in the Parser definition.
const tokenVocabulary = {}

// createToken is used to create a TokenType
// The Lexer's output will contain an array of token Objects created by metadata
const Identifier = createToken({
  name: 'Identifier',
  pattern: /\*|[a-zA-Z]\w*/,
})

// We specify the "longer_alt" property to resolve keywords vs identifiers ambiguity.
// See: https://github.com/SAP/chevrotain/blob/master/examples/lexer/keywords_vs_identifiers/keywords_vs_identifiers.js
const Select = createToken({
  name: 'Select',
  pattern: /SELECT/i,
  longer_alt: Identifier,
})
const From = createToken({
  name: 'From',
  pattern: /FROM/i,
  longer_alt: Identifier,
})
const Where = createToken({
  name: 'Where',
  pattern: /WHERE/i,
  longer_alt: Identifier,
})
const OrderBy = createToken({
  name: 'OrderBy',
  pattern: /ORDER BY/i,
  longer_alt: Identifier,
})

const Limit = createToken({
  name: 'Limit',
  pattern: /LIMIT/i,
  longer_alt: Identifier,
})

const Min = createToken({
  name: 'Min',
  pattern: /MIN/i,
  longer_alt: Identifier
})

const Max = createToken({
  name: 'Max',
  pattern: /MAX/i,
  longer_alt: Identifier
})

const Comma = createToken({ name: 'Comma', pattern: /,/ })
const Integer = createToken({ name: 'Integer', pattern: /0|[1-9]\d*/ })
const GreaterThanEqual = createToken({
  name: 'GreaterThanEqual',
  pattern: />=/,
})
const GreaterThan = createToken({
  name: 'GreaterThan',
  pattern: />/,
})
const LessThanEqual = createToken({ name: 'LessThanEqual', pattern: /<=/ })
const LessThan = createToken({
  name: 'LessThan',
  pattern: /</,
})
const Asc = createToken({ name: 'Asc', pattern: /ASC/, longer_alt: Identifier })
const Desc = createToken({
  name: 'Desc',
  pattern: /DESC/,
  longer_alt: Identifier,
})
const Equal = createToken({ name: 'Equal', pattern: /=/ })
const NotEqual = createToken({ name: 'NotEqual', pattern: /<>/ })

const LParen = createToken({
  name: 'LParen',
  pattern: /\(/
})

const RParen = createToken({
  name: 'RParen',
  pattern: /\)/
})

const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
})

let allTokens = [
  WhiteSpace,
  // "keywords" appear before the Identifier
  Select,
  From,
  Where,
  OrderBy,
  Limit,
  Comma,
  Asc,
  Desc,
  Min,
  Max,
  // The Identifier must appear after the keywords because all keywords are valid identifiers.
  Identifier,
  Integer,
  Equal,
  NotEqual,
  GreaterThanEqual,
  GreaterThan,
  LessThanEqual,
  LessThan,
  LParen,
  RParen
]

const SelectLexer = new Lexer(allTokens)

allTokens.forEach(tokenType => {
  tokenVocabulary[tokenType.name] = tokenType
})

module.exports = {
  tokenVocabulary: tokenVocabulary,

  lex: function(inputText) {
    const lexingResult = SelectLexer.tokenize(inputText)

    if (lexingResult.errors.length > 0) {
      throw Error('Lexing Errors detected.\n' + lexingResult.errors[0].message)
    }

    return lexingResult
  },
}
