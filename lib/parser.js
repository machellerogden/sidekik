'use strict';

module.exports = parser;

const identifiers = [ 'keyword', 'name', 'init' ];
const literals = [ 'string', 'number' ];

const nodeInitializers = [
    [
        token => token.type === 'kind',
        token => ({
            type: 'VariableDeclaration',
            kind: token.value,
            declarations: []
        })
    ], [
        token => token.type === 'paren' && token.value === '(',
        token => ({
            type: 'CallExpression',
            callee: null,
            arguments: []
        })
    ], [
        token => token.type === 'brace' && token.value === '{',
        token => ({
            type: 'ObjectExpression',
            properties: []
        })
    ], [
        token => token.type === 'bracket' && token.value === '[',
        token => ({
            type: 'ArrayExpression',
            elements: []
        })
    ], [
        token => token.type === 'member',
        token => ({
            type: 'MemberExpression',
            object: null,
            property: {
                type: 'Identifier',
                name: token.value
            }
        })
    ], [
        token => identifiers.includes(token.type),
        token => ({
            type: 'Identifier',
            name: token.value
        })
    ], [
        token => literals.includes(token.type),
        token => ({
            type: 'Literal',
            value: token.value
        })
    ]
];

const nodeAugmenters = [
    [
        (node, cursor) => (cursor.type === 'CallExpression' && node.type === 'VariableDeclaration'),
        (node, cursor, stack) => {
            delete cursor.callee;
            delete cursor.arguments;
            Object.keys(node).forEach(k => {
                cursor[k] = node[k];
            });
            const next = {
                type: 'VariableDeclarator',
                id: null,
                init: null
            };
            cursor.declarations.push(next);
            stack.push(next);
        }
    ], [
        (node, cursor) => (cursor.type === 'CallExpression' && !cursor.callee),
        (node, cursor, stack) => {

            cursor.callee = node;

            if ([ 'CallExpression', 'MemberExpression' ].includes(node.type)) {
                stack.push(node);
            }

        }
    ], [
        (node, cursor) => (cursor.type === 'CallExpression'),
        (node, cursor, stack) => {

            cursor.arguments.push(node);

            if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression' ].includes(node.type)) {
                stack.push(node);
            }

        }
    ], [
        (node, cursor) => (cursor.type === 'VariableDeclarator' && !cursor.id),
        (node, cursor, stack) => {

            cursor.id = node;

        }
    ], [
        (node, cursor) => (cursor.type === 'VariableDeclarator' && !cursor.init),
        (node, cursor, stack) => {

            cursor.init = node;

            if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression' ].includes(node.type)) {
                cursor._fulfilled = true;
                stack.push(node);
            } else {
                stack.pop();
            }

        }
    ], [
        (node, cursor) => (cursor.type === 'MemberExpression' && !cursor.object),
        (node, cursor, stack) => {

            cursor.object = node;
            cursor._fulfilled = true;

        }
    ], [
        (node, cursor) => (cursor.type === 'ObjectExpression'),
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
    ], [
        (node, cursor) => (cursor.type === 'ArrayExpression'),
        (node, cursor, stack) => {
            cursor.elements.push(node);

            if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression' ].includes(node.type)) {
                stack.push(node);
            }

        }
    ], [
        (node, cursor) => (cursor.type === 'Property' && !cursor.value),
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

    let ast;
    let stack = [];

    function reorient() {
        while (stack[stack.length - 1] && stack[stack.length - 1]._fulfilled) {
            delete stack[stack.length - 1]._fulfilled;
            stack.pop();
        }
    }

    for await (const token of tokens) {

        try {

            let node;

            if ([ 'whitespace', 'comment' ].includes(token.type)) continue;

            if ([ 'paren', 'brace', 'bracket' ].includes(token.type) && [ ')', '}', ']' ].includes(token.value)) {

                stack.pop();
                reorient();

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

                reorient();

            }

            let cursor = stack[stack.length - 1];

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
                    if (nodeAugmenters[naIdx][0](node, cursor)) {
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
            }

        } catch (e) {
            console.error('something bad happened', e);
        }
    }
}
