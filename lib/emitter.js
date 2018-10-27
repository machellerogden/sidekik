'use strict';

module.exports = emitter;

async function* emitter(programs) {

    const emit = {
        Program: (node, emitter) =>
            node.body.map(emitter).join('\n'),
        ExpressionStatement: (node, emitter) =>
            `${emitter(node.expression)};`,
        CallExpression: (node, emitter) =>
            `${emitter(node.callee)}(${node.arguments.map(emitter).join(', ')})`,
        VariableDeclaration: (node, emitter) =>
            `${node.kind} ${emitter(node.declarations[0].id)} = ${emitter(node.declarations[0].init)};`,
        ObjectExpression: (node, emitter) =>
            `{ ${node.properties.map(emitter).join(', ')} }`,
        ArrayExpression: (node, emitter) =>
            `[ ${node.elements.map(emitter).join(', ')} ]`,
        Property: (node, emitter) =>
            `${emitter(node.key)}: ${emitter(node.value)}`,
        MemberExpression: (node, emitter) =>
            `${emitter(node.object)}.${emitter(node.property)}`,
        Identifier: node =>
            node.name,
        Literal: node =>
            typeof node.value === 'string'
                ? JSON.stringify(node.value)
                : node.value
    };

    for await (const ast of programs) {
        if (ast == null) continue;

        function emitter(node) {
            if (emit[node.type] == null) throw TypeError(node.type);
            return emit[node.type](node, emitter);
        }

        yield emitter(ast);
    }
}
