'use strict';

module.exports = [
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
