'use strict';

const toPull = require('stream-to-pull-stream');
const pull = require('pull-stream');
const decode = require('pull-utf8-decoder');
const fs = require('fs');
const path = require('path');
const through = require('pull-through');

const tokenizer = require('./lib/tokenizer');

const testFilePath = path.join(__dirname, '.', 'test_file');
console.log('test file:', testFilePath);

const charStream = pull(toPull.source(fs.createReadStream(testFilePath)), decode('utf8'), through(function (data) {
    data.split('').forEach(this.queue.bind(this))
}));

pull(charStream, tokenizer, pull.drain(console.log));
