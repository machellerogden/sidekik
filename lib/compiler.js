'use strict';

const pull = require('pull-stream');

const tokenizer = require('./tokenizer');
const parser = require('./parser');
const transformer = require('./transformer');
const emitter = require('./emitter');

module.exports = () => pull(tokenizer(), parser(), transformer(), emitter());
