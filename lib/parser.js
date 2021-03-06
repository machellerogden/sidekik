'use strict';

module.exports = parser;

const initializers = require('./initializers');
const builders = require('./builders');

async function* parser(tokens) {

    let ast;
    let stack = [];

    function clearFulfilled() {
        while (stack[stack.length - 1] && stack[stack.length - 1]._fulfilled) {
            delete stack[stack.length - 1]._fulfilled;
            stack.pop();
        }
    }

    for await (const token of tokens) {

        try {

            if ([ 'whitespace', 'comment' ].includes(token.type)) continue;

            if ([ 'paren', 'brace', 'bracket' ].includes(token.type) && [ ')', '}', ']' ].includes(token.value)) {

                stack.pop();
                clearFulfilled();

                if (ast != null && stack.length === 0) {
                    const result = ast;
                    ast = null;
                    stack = [];
                    yield {
                        type: 'Program',
                        body: [ result ]
                    };
                }

                continue;

            } else {

                clearFulfilled();

            }

            let cursor = stack[stack.length - 1];

            let node = typeof initializers[token.type] === 'function'
                ? initializers[token.type](token.value)
                : initializers[token.type][token.value](token.value);

            if (node == null) throw new TypeError(`wtf is a \`${token.type}\``);

            if (cursor && typeof builders[cursor.type] === 'function') builders[cursor.type](node, stack);

            // if we haven't already started windowing, now would be a good time to start...
            if (ast == null) {
                ast = node;
                stack.push(ast);
            }

        } catch (e) {
            console.error('something bad happened', e);
        }
    }
}
