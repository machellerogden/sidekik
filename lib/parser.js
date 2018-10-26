'use strict';

// Welcome to duck typing hell! Please enjoy your stay.
// I've made this as clear as I can, but it's fucking compiler ... just do your best to follow along.

module.exports = parser;

const identifiers = [ 'keyword', 'name', 'init' ];
const literals = [ 'string', 'number' ];

async function* parser(tokens) {

    // `ast` windows the stream as we build expression statements
    let ast;

    // `cursor`, `parent` and `depth` provide some coordinates so we can navigate an otherwise unknown forest of abstract syntax

    // `cursor` holds a reference to our current location in the tree
    let cursor;

    // `parent` is a cursor to the parent node in the tree should one exist. It effectively gives us a back button.
    let parent;

    // `depth` keeps track of how deep we are in the tree.
    let depth = 0;

    for await (const token of tokens) {
        if (process.env.LISPRIMA_DEBUG) {
            console.log('***********************************');
            console.log('token', token);
        }

        try {

            // `node` is the current ast node we're working on for this iteration
            let node;

            let nextCursor;

            // we give zero fucks about whitespace and comments ... for now
            if ([ 'whitespace', 'comment' ].includes(token.type)) continue;

            // keeping track of depth is our first order of business
            if ([ 'paren', 'brace', 'bracket' ].includes(token.type)) {
                if ([ ')', '}', ']' ].includes(token.value)) depth--;
                if ([ '(', '{', '[' ].includes(token.value)) depth++;
            }

            // if we have ast and we're back to 0, then it's time to yield.
            // we yield each statement as it's own program to facilitate streaming.
            if (ast != null && depth === 0) {
                const result = ast;
                ast = null;
                cursor = null;
                parent = null;
                yield {
                    type: 'Program',
                    body: [ result ]
                };
                continue;
            }

            // we've updated `depth` and we didn't yield, so point cursor back to parent and move on
            if (token.type === 'paren' && token.value === ')') {
                cursor = parent || cursor || ast;
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
                console.log('1 - depth', depth);
                console.log('1 - cursor', cursor);
                console.log('1 - ast', ast);
                console.log('1 - node', node);
            }

            // if we see a member token, we have more work to do ... we set the base structure of the node and move on.
            if (token.type === 'member') {

                node = {
                    type: 'MemberExpression',
                    object: null,
                    property: {
                        type: 'Identifier',
                        name: token.value
                    }
                };

            // if we see a kind token, we're dealing with a special form—a VariableDeclaration. We setup the base structure of the node and move on.
            } else if (token.type === 'kind') {

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

                parent = cursor;
                cursor = node;
                continue;

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
            } else if (token.type === 'paren' && token.value === '(') {
                node = {
                    type: 'CallExpression',
                    callee: null,
                    arguments: []
                };
            }

            if (process.env.LISPRIMA_DEBUG) {
                console.log('2 - cursor', cursor);
                console.log('2 - ast', ast);
                console.log('2 - node', node);
            }

            // if we made it here, then we can assume this is an actual CallExpression and not a special form. Let's set the callee as the current node...
            if (cursor && cursor.type === 'CallExpression' && !cursor.callee) {

                cursor.callee = node;

                if (node.type === 'CallExpression') {
                    parent = cursor;
                    cursor = node;
                }

                if (node.type === 'MemberExpression') {
                    cursor = node;
                }

            // it looks like we're building a CallExpression
            } else if (cursor && cursor.type === 'CallExpression') {

                // add current node as an argument
                cursor.arguments.push(node);

                if (node.type === 'CallExpression') {
                    parent = cursor;
                    cursor = node;
                }

            // looks like we're currently building a declaration but we don't yet have an id
            } else if (cursor && cursor.type === 'VariableDeclarator' && !cursor.id) {

                if (token.type !== 'name') throw new TypeError(`Received invalid token type while building VariableDeclarator id: ${token.type}`);
                cursor.id = node;

            // looks like we're currently building a declaration but we don't yet have an init
            } else if (cursor && cursor.type === 'VariableDeclarator' && !cursor.init) {

                if (![ 'string', 'number' ].includes(token.type)) throw new TypeError(`Received invalid token type while building VariableDeclarator init: ${token.type}`);
                cursor.init = node;
                cursor = parent;

            // looks like we're currently building a member expression
            } else if (cursor && cursor.type === 'MemberExpression') {

                cursor.object = node;
                cursor = parent;

            }

            // let's get started building our tree if we haven't already
            if (ast == null) {

                ast = node || {
                    type: 'CallExpression',
                    callee: null,
                    arguments: []
                };
                cursor = ast;
                parent = ast;

            }

            if (process.env.LISPRIMA_DEBUG) {
                console.log('3 - cursor', cursor);
                console.log('3 - ast', ast);
                console.log('3 - node', node);
            }

            continue;

        } catch (e) {
            console.error('something bad happened', e);
        }
    }
}
