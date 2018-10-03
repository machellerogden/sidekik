'use strict';

const emit = {
    Program: (node, emitter) =>
        node.body.map(emitter).join('\n'),
    ExpressionStatement: (node, emitter) =>
        `${emitter(node.expression)};`,
    CallExpression: (node, emitter) => {
        return `${emitter(node.callee)}(${node.arguments.map(emitter).join(', ')})`;
    },
    Identifier: node =>
        node.name,
    Literal: node =>
        typeof node.value === 'string'
            ? `"${node.value}"`
            : node.value
};

module.exports = () => (read) => (end, cb) => read(end, (end, data) => {
    if (data == null) return cb(end, null);
    function emitter(node) {
        if (emit[node.type] == null) throw TypeError(node.type);
        return emit[node.type](node, emitter);
    }
    return cb(null, emitter(data));
});
