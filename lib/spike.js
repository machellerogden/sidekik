'use strict';

// prune fulfilled from stack
// token => node (if node fulfilled, mark as such)
// place node into cursor (placement based on cursor type)
// if node was not unfulfilled by current token, push node to stack as new cursor

'use strict';

module.exports = parser;

async function* parser(tokens) {

    let ast;
    let stack = [];

    function pruneStack() {
        while (stack[stack.length - 1] && stack[stack.length - 1]._fulfilled) {
            delete stack[stack.length - 1]._fulfilled;
            stack.pop();
        }
    }

    for await (const token of tokens) {

        try {

            // skip whitespace and comments
            if ([ 'whitespace', 'comment' ].includes(token.type)) continue;

            // if closing token of balance group
            if ([ 'paren', 'brace', 'bracket' ].includes(token.type) && [ ')', '}', ']' ].includes(token.value)) {

                // we're closing the current form, so drop the current stack node
                stack.pop();

                // if needed, drop any additional fulfilled stack nodes
                pruneStack();

                // if we have AST and our stack is empty, we're ready to yield
                if (ast != null && stack.length === 0) {
                    const result = ast;
                    ast = null;
                    stack = [];
                    yield {
                        type: 'Program',
                        body: [ result ]
                    };
                }

                // having dealt with the closing token, we're ready to head to the next token
                continue;

            } else {

                // if needed, drop any additional fulfilled stack nodes
                pruneStack();

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
