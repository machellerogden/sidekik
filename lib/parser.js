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
        value: Number(value)
    })
};

async function* parser(tokens) {
    let ast;
    let cursor;
    let depth = 0;
    for await (const token of tokens) {
        if (token.type === 'whitespace') continue;
        if (token.type === 'paren' && token.value === ')') depth--;
        if (token.type === 'paren' && token.value === '(') depth++;
        if (ast != null && depth === 0) {
            const result = ast;
            ast = null;
            cursor = null;
            yield {
                type: 'Program',
                body: [ result ],
            };
            continue;
        }
        if (token.type === 'paren' && token.value === ')') continue;
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
