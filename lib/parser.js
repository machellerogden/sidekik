'use strict';


const pull = require('pull-stream')
const window = require('pull-window')

const cast = {
    ref: name => ({
        type: 'Identifier',
        name
    }),

    string: value => ({
        type: 'Literal',
        value
    }),

    number: value => ({
        type: 'Literal',
        value
    })
};

const parser = (ast, cursor) => {
    return window((token, cb) => {
        if (ast != null) return;

        if (token.type === 'paren' && token.value === ')') return; // skip
        if (token.type === 'whitespace') return; // skip

        return (end, token) => {

            if (end) return cb(null, ast);

            if (token.type === 'whitespace') return; // skip

            if (token.type === 'paren' && token.value === ')') {
                const result = {
                    type: 'Program',
                    body: [ ast ],
                };
                ast = null;
                cursor = null;
                return cb(end, result); // close window
            }

            if (cursor && cursor.callee) {
                if (token.type === 'paren' && token.value === '(') {
                    const next = {
                        type: 'CallExpression',
                        callee: null,
                        arguments: [],
                    };
                    cursor.arguments.push(next);
                    cursor = next;
                } else {
                    cursor.arguments.push(cast[token.type] && cast[token.type](token.value) || token.value);
                }
            } else if (ast) {
                cursor.callee = cast[token.type] && cast[token.type](token.value) || token.value;
            } else if (token.type === 'paren' && token.value === '(') {
                ast = {
                    type: 'CallExpression',
                    callee: null,
                    arguments: [],
                };
                cursor = ast;
            }
        };

    }, (start, data) => data);
};

module.exports = parser;
