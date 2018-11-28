'use strict';

const { pipe } = require('needful');
const tokenizer = require('./tokenizer');
const parser = require('./parser');
const transformer = require('./transformer');
const emitter = require('./emitter');
const { split } = require('./util');

module.exports = pipe(split, tokenizer, parser, transformer, emitter);

// leaving this here for now for debugging
//const { split, tap } = require('./util');
//module.exports = pipe(tokenizer, parser, tap, transformer, emitter);
