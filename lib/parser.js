'use strict';

// Welcome to duck typing hell! Please enjoy your stay.
// I've made this as clear as I can, but it's fucking compiler ... just do your best to follow along.

module.exports = parser;

const identifiers = [ 'keyword', 'name', 'init' ];
const literals = [ 'string', 'number' ];

async function* parser(tokens) {

    // `ast` windows the stream as we build expression statements
    let ast;

    // `stack` holds a depth-first stack so we can navigate out way in and out of deeply nested structres.
    let stack = [];

    for await (const token of tokens) {
        if (process.env.LISPRIMA_DEBUG) {
            console.log('***********************************');
            console.log('token', token);
        }

        try {

            // `node` is the current ast node we're working on for this iteration
            let node;

            // `cursor` is current position
            let cursor = stack[stack.length - 1];

            // we give zero fucks about whitespace and comments ... for now
            if ([ 'whitespace', 'comment' ].includes(token.type)) continue;

            // if we meet with the right side of a balance group, back out of the stack
            if ([ 'paren', 'brace', 'bracket' ].includes(token.type) && [ ')', '}', ']' ].includes(token.value)) {
                stack.pop();

                // at this point, if we have ast and we're back to 0, then it's time to yield.
                // we yield each statement as it's own program to facilitate streaming.
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
            }

            // A few basic nodes we need to support:
            //
            // * Identifier
            // * Literal
            // * ObjectExpression
            // * ArrayExpression
            // * LogicalExpression
            // * CallExpression
            // * RegExpLiteral
            // * NewExpression
            // * ArrowFunctionExpression
            // * ConditionalExpression
            // * SequenceExpression
            // * ThisExpression
            // * UnaryExpression
            // * UpdateExpression

            if (process.env.LISPRIMA_DEBUG) {
                console.log('1 - stack', stack);
                console.log('1 - cursor', cursor);
                console.log('1 - ast', ast);
                console.log('1 - node', node);
            }

            // let's address special forms first ... basically, anything that is not a CallExpression

            // if we see a kind token, we're dealing with a special form—a VariableDeclaration. We setup the base structure of the node and move on.
            if (token.type === 'kind') {

                // since we assume all closures are CallExpressions to start, we need to correct this assumption
                delete cursor.callee;
                delete cursor.arguments;

                cursor.type = 'VariableDeclaration';
                cursor.kind = token.value;

                const node = {
                    type: 'VariableDeclarator',
                    id: null,
                    init: null
                };

                cursor.declarations = [
                    node
                ];

                stack.push(node);

                continue;
            }


            // we're done with special forms ... so, now we build nodes...

            // time to start building an object expression!
            if (token.type === 'brace' && token.value === '{') {

                node = {
                    type: 'ObjectExpression',
                    properties: []
                };

            // time to start building an object expression!
            } else if (token.type === 'bracket' && token.value === '[') {

                node = {
                    type: 'ArrayExpression',
                    elements: []
                };

            // if we see a member token, we have more work to do ... we set the base structure of the node and move on.
            } else if (token.type === 'member') {

                node = {
                    type: 'MemberExpression',
                    object: null,
                    property: {
                        type: 'Identifier',
                        name: token.value
                    }
                };

            // some tokens are easy ... like identifiers
            } else if (identifiers.includes(token.type)) {
                node = {
                    type: 'Identifier',
                    name: token.value
                };

            // ... and literals
            } else if (literals.includes(token.type)) {
                node = {
                    type: 'Literal',
                    value: token.value
                };

            // when we see an open paren, we assume it's a CallExpression. If later we find out that it's a special form, we will correct course at that time.
            } else if (token.type === 'paren' && token.value === '(') {
                node = {
                    type: 'CallExpression',
                    callee: null,
                    arguments: []
                };
            }

            if (process.env.LISPRIMA_DEBUG) {
                console.log('2 - stack', stack);
                console.log('2 - cursor', cursor);
                console.log('2 - ast', ast);
                console.log('2 - node', node);
            }

            if (cursor) {

                // if we made it here, then we can assume this is an actual CallExpression and not a special form. Let's set the callee as the current node...
                if (cursor.type === 'CallExpression' && !cursor.callee) {

                    cursor.callee = node;

                    if ([ 'CallExpression', 'MemberExpression' ].includes(node.type)) {
                        stack.push(node);
                    }

                    continue;

                }

                // it looks like we're building a CallExpression
                if (cursor.type === 'CallExpression') {

                    // add current node as an argument
                    cursor.arguments.push(node);

                    if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression' ].includes(node.type)) {
                        stack.push(node);
                    }

                    continue;

                }

                // looks like we're currently building a declaration but we don't yet have an id
                if (cursor.type === 'VariableDeclarator' && !cursor.id) {

                    if (token.type !== 'name') throw new TypeError(`Received invalid token type while building VariableDeclarator id: ${token.type}`);
                    cursor.id = node;

                    continue;

                }

                // looks like we're currently building a declaration but we don't yet have an init
                if (cursor.type === 'VariableDeclarator' && !cursor.init) {

                    if (![ 'string', 'number' ].includes(token.type)) throw new TypeError(`Received invalid token type while building VariableDeclarator init: ${token.type}`);
                    cursor.init = node;

                    if ([ 'MemberExpression', 'ObjectExpression', 'ArrayExpression' ].includes(node.type)) {
                        stack.push(node);
                    } else {
                        stack.pop();
                    }

                    continue;

                }

                // looks like we're currently building a member expression
                if (cursor.type === 'MemberExpression') {

                    cursor.object = node;
                    stack.pop();

                    continue;

                }

                if (cursor.type === 'ObjectExpression') {
                    const next = {
                        type: 'Property',
                        key: node,
                        value: null,
                        kind: 'init'
                    };
                    cursor.properties.push(next);
                    stack.push(next);

                    continue;

                }

                if (cursor.type === 'ArrayExpression') {
                    cursor.elements.push(node);

                    if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression' ].includes(node.type)) {
                        stack.push(node);
                    }

                    continue;

                }

                if (cursor.type === 'Property') {

                    cursor.value = node;
                    stack.pop();

                    continue;
                }
            }

            // let's get started building our tree if we haven't already
            ast = node;
            stack.push(ast);

            if (process.env.LISPRIMA_DEBUG) {
                console.log('3 - stack', stack);
                console.log('3 - cursor', cursor);
                console.log('3 - ast', ast);
                console.log('3 - node', node);
            }

        } catch (e) {
            console.error('something bad happened', e);
        }
    }
}
