'use strict';

module.exports = emitter;

const emit = {
    Program: (node, emitter) =>
        node.body.map(emitter).join('\n'),
    ExpressionStatement: (node, emitter) =>
        `${emitter(node.expression)};`,
    CallExpression: (node, emitter) =>
        `${emitter(node.callee)}(${node.arguments.map(emitter).join(', ')})`,
    Identifier: node =>
        node.name,
    Literal: node =>
        typeof node.value === 'string'
            ? `"${node.value}"`
            : node.value
};

function emitter(node) {
    if (emit[node.type] == null) throw TypeError(node.type);
    return emit[node.type](node, emitter);
}
