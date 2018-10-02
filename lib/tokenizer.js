'use strict';

const pull = require('pull-stream');
const toPull = require('stream-to-pull-stream');
const utf8 = require('pull-utf8-decoder');
const split = require('pull-split');
const matchers = require('./matchers');

module.exports = () => pull(toPull.source(process.stdin), utf8(), split(), (read) => (end, cb) => read(end, (end, data) => {
    return cb(end, data != null
        ? data.split('').reduce((tokens, char, i, chars) => {
            const result = matchers.reduce((token, fn) => token || fn(chars, i), null);
            if (!result) cb(new TypeError(`Unknown Token: ${char}`));
            const { token, idx } = result;
            const consumed = idx - i - 1;
            if (consumed) chars.splice(i, consumed);
            if (token == null) return tokens;
            return [ ...tokens, token ];
          }, [])
        : null);
}), pull.flatten());
