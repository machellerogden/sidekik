'use strict';

module.exports = parser;

const { cast } = require('forast'); // can't use until we solve the raw string issue ... could just use astring instead of custom emitter and get around this no problemo

const castLeaf = {
    keyword: name => ({
        type: 'Identifier', // TODO
        name
    }),

    member: name => ({
        type: 'Identifier',
        name
    }),

    name: name => ({
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

    // `ast` windows the stream as we build expression statements
    let ast;

    // `cursor`, `parent` and `depth` provide some coordinates so we can navigate an otherwise unknown forest of abstract syntax

    // `cursor` references our current location in the tree
    let cursor;

    // `parent` is a cursor to the parent node in the tree should one exist. It effectively gives us a back button.
    let parent;

    // `depth` keeps track of how deep we are in the tree.
    let depth = 0;

    for await (const token of tokens) {

        // we give zero fucks about whitespace ... for now
        if (token.type === 'whitespace') continue;

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

        // we've updated `depth` and we didn't yield, so discard the closing paren
        if (token.type === 'paren' && token.value === ')') continue;

        // So, what's next?
        //
        // It could be one of the following...
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

        let next;
        if (token.type === 'paren' && token.value === '(') {
            next = {
                type: 'CallExpression',
                callee: null,
                arguments: [],
            };
        } else if (token.type === 'keyword') {
            next = {
                type: 'Identifier', // TODO ... this is a lie
                name: token.value
            };
        } else if(token.type === 'member') {
            next = {
                type: 'Identifier',
                name: token.value
            };
        } else if(token.type === 'name') {
            next = {
                type: 'Identifier',
                name: token.value
            };
        } else if(token.type === 'string') {
            next = {
                type: 'Literal',
                value: token.value
            };
        } else if(token.type === 'number') {
            next = {
                type: 'Literal',
                value: Number(token.value)
            };
        }

        // looks like we're curently building a call expression
        if (cursor && cursor.type === 'CallExpression' && cursor.callee) {


            // ...here comes another CallExpression
            cursor.arguments.push(next);
            cursor = next;
            continue;

            cursor.arguments.push();
            continue;
        }

        // looks like we're currently building a call expression, and we don't yet have a callee
        if (cursor && cursor.type === 'CallExpression') {
            if (token.type === 'member') {
                cursor.callee = {
                    type: 'MemberExpression',
                    object: null,
                    property: castLeaf[token.type] && castLeaf[token.type](token.value, token.raw) || token.value
                };
                parent = cursor;
                cursor = cursor.callee;
            // whoa... actually not a CallExpression, this is a VariableDeclaration ... let's adjust accordingly
            } else if (token.type === 'name' && [ 'var', 'let', 'const' ].includes(token.value)) {
                delete cursor.callee;
                delete cursor.arguments;
                cursor.type = 'VariableDeclaration';
                cursor.kind = token.value;
                const declarator = {
                    type: 'VariableDeclarator',
                    id: null,
                    init: null
                };
                cursor.declarations = [
                    declarator
                ];
                parent = cursor;
                cursor = declarator;
            } else {
                cursor.callee = castLeaf[token.type] && castLeaf[token.type](token.value, token.raw) || token.value;
            }
            continue;
        }

        // looks like we're currently building a declaration and we already have id but we still don't have init
        if (cursor && cursor.type === 'VariableDeclarator' && cursor.id && !cursor.init) {
            if (![ 'string', 'number' ].includes(token.type)) throw new TypeError(`Received invalid token type while building VariableDeclarator init: ${token.type}`);
            cursor.init = castLeaf[token.type](token.value, token.raw);
            // variable declaration is done. let's get out of here...
            cursor = parent;
            continue;
        }

        // looks like we're currently building a declaration and we don't yet have an id
        if (cursor && cursor.type === 'VariableDeclarator') {
            if (token.type !== 'name') throw new TypeError(`Received invalid token type while building VariableDeclarator id: ${token.type}`);
            cursor.id = castLeaf[token.type](token.value, token.raw);
            continue;
        }

        // looks like we're currently building a member expression
        if (cursor && cursor.type === 'MemberExpression') {
            cursor.object = castLeaf[token.type] && castLeaf[token.type](token.value, token.raw) || token.value;
            // member expression is done. let's get out of here...
            cursor = parent;
            continue;
        }

        // looks like it's time to start building a call expression
        if (token.type === 'paren' && token.value === '(') {
            ast = {
                type: 'CallExpression',
                callee: null,
                arguments: [],
            };
            cursor = ast;
            continue;
        }
    }
}
