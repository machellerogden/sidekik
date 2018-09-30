'use strict';

module.exports = parser;

function parser(tokens) {
    let current = 0;

    function walk() {
        let token = tokens[current];

        if (token.type === 'string') {
            current++;
            return {
                type: 'Literal',
                value: token.value,
            };
        }

        if (token.type === 'number') {
            current++;
            return {
                type: 'Literal',
                value: Number(token.value),
            };
        }

        if (token.type === 'whitespace') {
            current++;
            return walk();
        }

        if (token.type === 'paren' && token.value === '(') {
            token = tokens[++current];

            // if token.type !== 'ref' throw syntax error
            let node = {
                type: 'CallExpression',
                name: token.value,
                params: [],
            };
            token = tokens[++current];

            while ((token.type !== 'paren') || (token.type === 'paren' && token.value !== ')')) {
                node.params.push(walk());
                token = tokens[current];
            }

            current++;

            return node;
        }

        throw new TypeError(token.type);
    }

    let ast = {
        type: 'Program',
        body: [],
    };

    while (current < tokens.length) {
        ast.body.push(walk());
    }

    return ast;
}
