'use strict';

// Welcome to duck typing hell! Please enjoy your stay.
// I've made this as clear as I can, but it's fucking compiler ... just do your best to follow along.

module.exports = parser;

const identifiers = [ 'keyword', 'name', 'init' ];
const literals = [ 'string', 'number' ];

const { inspect } = require('util');
const log = (head, ...rest) => console.log(head, inspect(rest, { depth: null, colors: true }));

async function* parser(tokens) {

    // `ast` windows the stream as we build expression statements
    let ast;

    // `stack` holds a depth-first stack so we can navigate out way in and out of deeply nested structres.
    let stack = [];

    function backtrack() {
        while (stack[stack.length - 1] && stack[stack.length - 1].do_not_revisit) {
            delete stack[stack.length - 1].do_not_revisit;
            stack.pop();
        }
    }

    for await (const token of tokens) {
        //if (process.env.LISPRIMA_DEBUG) {
            //log('***********************************');
            //log('token', token);
        //}

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

            // there are 2 conditions where we want to backtrack up the stack ... when closing a balance group, as done above and when we've marked the a cursor with `do_not_revisit`.
            } else {

                backtrack();

            }

            // `cursor` refers to the current stack node
            let cursor = stack[stack.length - 1];

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

            //if (process.env.LISPRIMA_DEBUG) {
                //log('1 - cursor', cursor);
                //log('1 - ast', ast);
            //}

            // let's address special forms first ... basically, anything that is not a CallExpression

            // if we see a kind token, we're dealing with a special form—a VariableDeclaration. We setup the base structure of the node and move on.
            if (token.type === 'kind') {

                // correct the now invalidated assumption
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


            // we're done with special forms ... so, now we build nodes...

            // when we see an open paren, we assume it's a CallExpression. If later we find out that it's a special form, we will correct course at that time.
            if (token.type === 'paren' && token.value === '(') {

                node = {
                    type: 'CallExpression',
                    callee: null,
                    arguments: []
                };

                // let's get started building our tree if we haven't already
                if (ast == null) {
                    ast = node;
                    stack.push(ast);
                    continue;
                }

            // time to start building an object expression!
            } else if (token.type === 'brace' && token.value === '{') {

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

            // don't know what this is ... should probably throw. continuing for now.
            } else {
                continue;
            }

            //if (process.env.LISPRIMA_DEBUG) {
                //log('2 - cursor', cursor);
                //log('2 - ast', ast);
                //log('2 - node', node);
            //}

            if (cursor) {

                // if we made it here, then we can assume this is an actual CallExpression and not a special form. Let's set the callee as the current node...
                if (cursor.type === 'CallExpression' && !cursor.callee) {

                    cursor.callee = node;

                    if ([ 'CallExpression', 'MemberExpression' ].includes(node.type)) {
                        stack.push(node);
                    }

                // it looks like we're building a CallExpression
                } else if (cursor.type === 'CallExpression') {

                    // add current node as an argument
                    cursor.arguments.push(node);

                    if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression' ].includes(node.type)) {
                        stack.push(node);
                    }

                // looks like we're currently building a declaration but we don't yet have an id
                } else if (cursor.type === 'VariableDeclarator' && !cursor.id) {

                    cursor.id = node;

                // looks like we're currently building a declaration but we don't yet have an init
                } else if (cursor.type === 'VariableDeclarator' && !cursor.init) {

                    cursor.init = node;

                    if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression' ].includes(node.type)) {
                        cursor.do_not_revisit = true;
                        stack.push(node);
                    } else {
                        stack.pop();
                    }

                // looks like we're currently building a member expression
                } else if (cursor.type === 'MemberExpression' && !cursor.object) {

                    cursor.object = node;
                    cursor.do_not_revisit = true;

                } else if (cursor.type === 'ObjectExpression') {
                    const next = {
                        type: 'Property',
                        key: node,
                        value: null,
                        kind: 'init'
                    };
                    cursor.properties.push(next);
                    stack.push(next);

                } else if (cursor.type === 'ArrayExpression') {
                    cursor.elements.push(node);

                    if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression' ].includes(node.type)) {
                        stack.push(node);
                    }

                } else if (cursor.type === 'Property' && !cursor.value) {

                    cursor.value = node;

                    if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression' ].includes(node.type)) {
                        cursor.do_not_revisit = true;
                        stack.push(node);
                    } else {
                        stack.pop();
                    }

                }
            }

            //if (process.env.LISPRIMA_DEBUG) {
                //log('3 - cursor', cursor);
                //log('3 - ast', ast);
                //log('3 - node', node);
            //}

        } catch (e) {
            console.error('something bad happened', e);
        }
    }
}
