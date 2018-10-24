'use strict';

module.exports = parser;

const { cast:forastCast } = require('forast'); // can't use until we solve the raw string issue ... could just use astring instead of custom emitter and get around this no problemo

const cast = {
    keyword: name => ({
        type: 'Identifier', // TODO ... this is a lie
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

    string: (value, raw) => ({
        type: 'Literal',
        value,
        raw
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

        // we give zero fucks about whitespace
        if (token.type === 'whitespace') continue;

        // keeping track of depth is our first order of business
        if (token.type === 'paren') {
            if (token.value === ')') depth--;
            if (token.value === '(') depth++;
        }

        // WIP - ArrayExpressions and ObjectExpressions
        //if ([ 'paren', 'brace', 'bracket' ].includes(token.type)) {
            //if [ ')', '}', ']' ].includes(token.value)) depth--;
            //if ([ '(', '{', '[' ].includes(token.value)) depth++;
        //}


        // if we have ast and we're back to 0, then it's time to yield an expression statement.
        // for now we don't even do that though ... we're letting the transformer handle it.
        // this will likely change soon, but for now, we instead yield each expression statement
        // as it's own program so that we're able to emit as we go from the source stream.
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

        // now that we've checked `depth` and we didn't yield, we no longer have any use for the closing paren.
        if (token.type === 'paren' && token.value === ')') continue;

        // looks like we're curently building a call expression
        if (cursor && cursor.type === 'CallExpression' && cursor.callee) {

            // since we are inside a call expression we need to add arguments.
            // First, we need to figure out what that argument could be.
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

            // ...here comes another CallExpression
            if (token.type === 'paren' && token.value === '(') {
                const next = {
                    type: 'CallExpression',
                    callee: null,
                    arguments: [],
                };
                cursor.arguments.push(next);
                cursor = next;
                continue;
            }

            cursor.arguments.push(cast[token.type] && cast[token.type](token.value, token.raw) || token.value);
            continue;
        }

        // looks like we're currently building a call expression, and we don't yet have a callee
        if (cursor && cursor.type === 'CallExpression') {
            if (token.type === 'member') {
                cursor.callee = {
                    type: 'MemberExpression',
                    object: null,
                    property: cast[token.type] && cast[token.type](token.value, token.raw) || token.value
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
                cursor.callee = cast[token.type] && cast[token.type](token.value, token.raw) || token.value;
            }
            continue;
        }

        // looks like we're currently building a declaration and we already have id but we still don't have init
        if (cursor && cursor.type === 'VariableDeclarator' && cursor.id && !cursor.init) {
            if (![ 'string', 'number' ].includes(token.type)) throw new TypeError(`Received invalid token type while building VariableDeclarator init: ${token.type}`);
            cursor.init = cast[token.type](token.value, token.raw);
            // variable declaration is done. let's get out of here...
            cursor = parent;
            continue;
        }

        // looks like we're currently building a declaration and we don't yet have an id
        if (cursor && cursor.type === 'VariableDeclarator') {
            if (token.type !== 'name') throw new TypeError(`Received invalid token type while building VariableDeclarator id: ${token.type}`);
            cursor.id = cast[token.type](token.value, token.raw);
            continue;
        }

        // looks like we're currently building a member expression
        if (cursor && cursor.type === 'MemberExpression') {
            cursor.object = cast[token.type] && cast[token.type](token.value, token.raw) || token.value;
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
