'use strict';

const tokenizer = require('./lib/tokenizer');
const parser = require('./lib/parser');
const traverser = require('./lib/traverser');
const transformer = require('./lib/transformer');
const emitter = require('./lib/emitter');

function compiler(input) {
    let tokens = tokenizer(input);
    let ast = parser(tokens);
    let program = transformer(ast);
    let output = emitter(program);
    return output;
}

module.exports = {
    tokenizer,
    parser,
    traverser,
    transformer,
    emitter,
    compiler
};
