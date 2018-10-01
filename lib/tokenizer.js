'use strict';

const pull = require('pull-stream');
const toPull = require('stream-to-pull-stream');
const utf8 = require('pull-utf8-decoder');
const split = require('pull-split');

const tokenizers = [
    // paren
    (chars, i) => ([ '(', ')' ].includes(chars[i])) && { token: { type: 'paren', value: chars[i] } },

    // whitespace
    (chars, i) => /\s/.test(chars[i]) && { token: { type: 'whitespace' } },

    // number
    (chars, i) => {
        let char = chars[i];
        const pattern = /[0-9]/;
        if (pattern.test(char)) {
            let value = '';
            while (pattern.test(char)) {
                value += char;
                char = chars[++i];
            }
            return { idx: i, token: { type: 'number', value } };
        }
    },

    // string
    (chars, i) => {
        let char = chars[i];
        if (char === '"') {
            let value = '';
            char = chars[++i];
            while (char !== '"' || chars[i - 1] === '\\') {
                value += char;
                char = chars[++i];
            }
            char = chars[++i];
            return { idx: i, token: { type: 'string', value } };
        }
    },

    // ref
    (chars, i) => {
        let char = chars[i];
        const pattern = /[a-z]/i;
        if (char != null && pattern.test(char)) {
            let value = '';
            while (char != null && pattern.test(char)) {
                value += char;
                char = chars[++i];
            }
            return { idx: i, token: { type: 'ref', value } };
        }
    }
];

const tokenizer = () => (read) => (end, cb) => read(end, (end, data) => {
    return cb(end, data != null
        ? data.split('').reduce((tokens, char, i, chars) => {
            const result = tokenizers.reduce((token, fn) => token || fn(chars, i), null);
            if (!result) cb(new TypeError(`Unknown Token: ${char}`));
            const { token, idx } = result;
            const consumed = idx - i - 1;
            if (consumed) chars.splice(i, consumed);
            if (token == null) return tokens;
            return [ ...tokens, token ];
          }, [])
        : null);
});

module.exports = pull(toPull.source(process.stdin), utf8(), split(), tokenizer());
