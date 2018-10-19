'use strict';

module.exports = parser;

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

async function* parser(tokens) {
    let ast;
    let cursor;
    for await (const token of tokens) {
        if (token.type === 'whitespace') continue;
        if (ast != null && token.type === 'paren' && token.value === ')') {
            const result = {
                type: 'Program',
                body: [ ast ],
            };
            ast = null;
            yield result;
            continue;
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
            continue;
        }
        if (ast) {
            cursor.callee = cast[token.type] && cast[token.type](token.value) || token.value;
            continue;
        }
        if (token.type === 'paren' && token.value === '(') {
            ast = {
                type: 'CallExpression',
                callee: null,
                arguments: [],
            };
            cursor = ast;
        }
    }
}
