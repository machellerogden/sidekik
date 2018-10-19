'use strict';

const { pipe } = require('needful');
const tokenizer = require('./tokenizer');
const parser = require('./parser');
const transformer = require('./transformer');
const emitter = require('./emitter');

module.exports = pipe(tokenizer, parser, transformer, emitter);
