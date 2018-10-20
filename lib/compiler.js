'use strict';

const { pipe } = require('needful');
const tokenizer = require('./tokenizer');
const parser = require('./parser');
const transformer = require('./transformer');
const emitter = require('./emitter');

async function* tap(chunks) {
    for await (const chunk of chunks) {
        console.log('chunk', require('util').inspect(chunk, {depth:null,colors:true}));
        yield chunk;
    }
}

module.exports = pipe(tokenizer, parser, transformer, emitter);
