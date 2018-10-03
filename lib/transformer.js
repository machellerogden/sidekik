'use strict';

const traverser = require('./traverser');

module.exports = () => (read) => (end, cb) => read(end, (end, ast) => {
    if (ast == null) return cb(end, null);

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
                    callee: node.callee,
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

    return cb(end, program);

});
