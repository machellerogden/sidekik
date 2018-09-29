'use strict';

module.exports = transformer;

const traverser = require('./traverser');

function transformer(ast) {

    let program = {
        type: 'Program',
        body: [],
    };

    ast._context = program.body;

    traverser(ast, {

        Literal: {
            enter(node, parent) {
                parent._context.push({
                    type: 'Literal',
                    value: node.value,
                });
            },
        },

        CallExpression: {
            enter(node, parent) {

                let expression = {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: node.name,
                    },
                    arguments: [],
                };

                node._context = expression.arguments;

                if (parent.type !== 'CallExpression') {
                    expression = {
                        type: 'ExpressionStatement',
                        expression: expression,
                    };
                }

                parent._context.push(expression);
            },
        }
    });

    return program;
}
