'use strict';

module.exports = parser;

const identifiers = [ 'keyword', 'name', 'init' ];
const literals = [ 'string', 'number' ];

const nodeInitializers = [
    [
        token => token.type === 'paren' && token.value === '(',
        token => ({
            type: 'CallExpression',
            callee: null,
            arguments: []
        })
    ],
    [
        token => token.type === 'brace' && token.value === '{',
        token => ({
            type: 'ObjectExpression',
            properties: []
        })
    ],
    [
        token => token.type === 'bracket' && token.value === '[',
        token => ({
            type: 'ArrayExpression',
            elements: []
        })
    ],
    [
        token => token.type === 'member',
        token => ({
            type: 'MemberExpression',
            object: null,
            property: {
                type: 'Identifier',
                name: token.value
            }
        })
    ],
    [
        token => identifiers.includes(token.type),
        token => ({
            type: 'Identifier',
            name: token.value
        })
    ],
    [
        token => literals.includes(token.type),
        token => ({
            type: 'Literal',
            value: token.value
        })
    ]
];

const nodeAugmenters = [
    [
        cursor => (cursor.type === 'CallExpression' && !cursor.callee),
        (node, cursor, stack) => {

            cursor.callee = node;

            if ([ 'CallExpression', 'MemberExpression' ].includes(node.type)) {
                stack.push(node);
            }

        }
    ],
    [
        cursor => (cursor.type === 'CallExpression'),
        (node, cursor, stack) => {

            cursor.arguments.push(node);

            if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression' ].includes(node.type)) {
                stack.push(node);
            }

        }
    ],
    [
        cursor => (cursor.type === 'VariableDeclarator' && !cursor.id),
        (node, cursor, stack) => {

            cursor.id = node;

        }
    ],
    [
        cursor => (cursor.type === 'VariableDeclarator' && !cursor.init),
        (node, cursor, stack) => {

            cursor.init = node;

            if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression' ].includes(node.type)) {
                cursor._fulfilled = true;
                stack.push(node);
            } else {
                stack.pop();
            }

        }
    ],
    [
        cursor => (cursor.type === 'MemberExpression' && !cursor.object),
        (node, cursor, stack) => {

            cursor.object = node;
            cursor._fulfilled = true;

        }
    ],
    [
        cursor => (cursor.type === 'ObjectExpression'),
        (node, cursor, stack) => {
            const next = {
                type: 'Property',
                key: node,
                value: null,
                kind: 'init'
            };
            cursor.properties.push(next);
            stack.push(next);
        }
    ],
    [
        cursor => (cursor.type === 'ArrayExpression'),
        (node, cursor, stack) => {
            cursor.elements.push(node);

            if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression' ].includes(node.type)) {
                stack.push(node);
            }

        }
    ],
    [
        cursor => (cursor.type === 'Property' && !cursor.value),
        (node, cursor, stack) => {

            cursor.value = node;

            if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression' ].includes(node.type)) {
                cursor._fulfilled = true;
                stack.push(node);
            } else {
                stack.pop();
            }

        }
    ]
];

async function* parser(tokens) {

    // `ast` holds a window on the stream until we've built a complete expression or statement
    let ast;

    // `stack` holds a depth-first stack so we can navigate our way in and out of deeply nested structres.
    let stack = [];

    // `backtrack` is a crude mechanism for exiting fulfilled leaves
    function backtrack() {
        while (stack[stack.length - 1] && stack[stack.length - 1]._fulfilled) {
            delete stack[stack.length - 1]._fulfilled;
            stack.pop();
        }
    }

    for await (const token of tokens) {

        try {

            // `node` is the current ast node we're working on for this iteration
            let node;

            // we give zero fucks about whitespace and comments ... for now
            if ([ 'whitespace', 'comment' ].includes(token.type)) continue;

            // if we meet with the right side of a balance group, back out of the stack
            if ([ 'paren', 'brace', 'bracket' ].includes(token.type) && [ ')', '}', ']' ].includes(token.value)) {

                stack.pop();
                backtrack();

                // at this point, if we have ast and we're back to 0, then it's time to yield.
                // we yield each statement as it's own program to avoid downstream buffering.
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

            // there are 2 conditions where we want to backtrack up the stack ... when closing a balance group, as done above and when we've marked the a cursor with `_fulfilled`.
            } else {

                backtrack();

            }

            // `cursor` provides an easy reference to the current node in the stack
            let cursor = stack[stack.length - 1];

            // consider special forms
            // TODO: we need a better way to consider special forms

            if (token.type === 'kind') {

                delete cursor.callee;
                delete cursor.arguments;

                cursor.type = 'VariableDeclaration';
                cursor.kind = token.value;

                const next = {
                    type: 'VariableDeclarator',
                    id: null,
                    init: null
                };

                cursor.declarations = [
                    next
                ];

                stack.push(next);
                continue;
            }

            // create node
            let niIdx = 0;
            while (niIdx < nodeInitializers.length) {
                if (nodeInitializers[niIdx][0](token)) {
                    node = nodeInitializers[niIdx][1](token);
                    break;
                }
                niIdx++;
            }

            // maybe should throw, but continue for now
            if (node == null) continue;

            // if we're already building something, let's run through our augmenters
            if (cursor) {
                let naIdx = 0;
                while (naIdx < nodeAugmenters.length) {
                    if (nodeAugmenters[naIdx][0](cursor)) {
                        nodeAugmenters[naIdx][1](node, cursor, stack);
                        break;
                    }
                    naIdx++;
                }
            }

            // if we haven't already started windowing, let's start now
            if (ast == null) {
                ast = node;
                stack.push(ast);
                continue;
            }

        } catch (e) {
            console.error('something bad happened', e);
        }
    }
}
