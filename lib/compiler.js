'use strict';

const { pipe } = require('needful');
const tokenizer = require('./tokenizer');
const parser = require('./parser');
const transformer = require('./transformer');
const emitter = require('./emitter');

// leaving this here for debugging as needed
async function* tap(chunks) {
    for await (const chunk of chunks) {
        console.log('\n\nchunk', require('util').inspect(chunk, { depth: null, colors: true }), '\n');
        yield chunk;
    }
}

module.exports = pipe(tokenizer, parser, tap, transformer, emitter);
