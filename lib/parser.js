'use strict';


const pull = require('pull-stream')
const window = require('pull-window')

const cast = {
    ref: value => ({
        type: 'Identifier',
        value
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

const parser = () => {
    let ast;
    let cursor;
    let next;
    return window((token, cb) => {
        if (ast != null) return;

        if (token.type === 'paren' && token.value === ')') return; // skip
        if (token.type === 'whitespace') return; // skip

        return (end, token) => {

            if (end) return cb(null, ast);

            if (token.type === 'whitespace') return; // skip

            if (token.type === 'paren' && token.value === ')') {
                const result = ast;
                ast = null;
                cursor = null;
                next = null;
                return cb(end, result); // close window
            }

            if (cursor && cursor.name) {
                if (token.type === 'paren' && token.value === '(') {
                    next = {
                        type: 'CallExpression',
                        name: null,
                        params: [],
                    };
                    cursor.params.push(next);
                    cursor = next;
                } else {
                    cursor.params.push(cast[token.type] && cast[token.type](token.value) || token.value);
                }
            } else if (ast) {
                cursor.name = cast[token.type] && cast[token.type](token.value) || token.value;
            } else if (token.type === 'paren' && token.value === '(') {
                ast = {
                    type: 'CallExpression',
                    name: null,
                    params: [],
                };
                cursor = ast;
            }
        };

    }, (start, data) => data);
};


//let ast = {
//type: 'Program',
//body: [],
//};

//while (current < tokens.length) {
//ast.body.push(walk());
//}

//return ast;

module.exports = parser;
