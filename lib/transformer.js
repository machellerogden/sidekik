'use strict';

module.exports = transformer;

const traverser = require('./traverser');

async function* transformer(programs) {

    for await (const ast of programs) {

        let program = {
            type: 'Program',
            body: [],
        };

        ast._context = program.body;

        traverser(ast, {

            Identifier: {
                enter(node, parent) {
                    if (Array.isArray(parent._context)) {
                        parent._context.push({
                            type: 'Identifier',
                            name: node.name
                        });
                    }
                },
            },

            Literal: {
                enter(node, parent) {
                    if (Array.isArray(parent._context)) {
                        parent._context.push({
                            type: 'Literal',
                            value: node.value,
                            raw: node.raw
                        });
                    }
                },
            },

            VariableDeclaration: {
                enter(node, parent) {
                    if (Array.isArray(parent._context)) {
                        parent._context.push({
                            type: 'VariableDeclaration',
                            declarations: node.declarations,
                            kind: node.kind
                        });
                    }
                },
            },

            ObjectExpression: {
                enter(node, parent) {
                    if (Array.isArray(parent._context)) {
                        parent._context.push({
                            type: 'ObjectExpression',
                            properties: node.properties
                        });
                    }
                },
            },

            ArrayExpression: {
                enter(node, parent) {
                    if (Array.isArray(parent._context)) {
                        parent._context.push({
                            type: 'ArrayExpression',
                            elements: node.elements
                        });
                    }
                },
            },

            FunctionDeclaration: {
                enter(node, parent) {

                    let declarations = {
                        type: 'FunctionDeclaration',
                        params: [],
                        body: {
                            type: 'BlockStatement',
                            body: []
                        }
                    };

                    node._context = declarations.params;

                    parent._context.push(declarations);
                },
            },

            CallExpression: {
                enter(node, parent) {

                    let expression = {
                        type: 'CallExpression',
                        callee: node.callee,
                        arguments: []
                    };

                    node._context = expression.arguments;

                    if (parent.type !== 'CallExpression') {
                        expression = {
                            type: 'ExpressionStatement',
                            expression
                        };
                    }

                    parent._context.push(expression);
                },
            }
        });

        yield program;
    }
}
