'use strict';

function WhoopsActuallyNotACallExpression(node, cursor) {
    delete cursor.callee;
    delete cursor.arguments;
    Object.keys(node).forEach(k => cursor[k] = node[k]);
}

function CallExpression (node, stack) {
    const cursor = stack[stack.length - 1];
    if (node.type === 'VariableDeclaration') {
        WhoopsActuallyNotACallExpression(node, cursor);
        const next = {
            type: 'VariableDeclarator',
            id: null,
            init: null
        };
        cursor.declarations.push(next);
        stack.push(next);
    } else if (node.type === 'FunctionDeclaration') {
        WhoopsActuallyNotACallExpression(node, cursor);
        if (cursor.id == null) {
            cursor.id = {
                type: 'Identifier',
                name: null
            };
        } else if (!cursor.params.length) {
            cursor.params.push(node);
            if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression', 'FunctionExpression' ].includes(node.type)) {
                stack.push(node);
            }
        } else {
            cursor.body.body.push(node);
            if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression', 'FunctionExpression' ].includes(node.type)) {
                stack.push(node);
            }
        }
    } else if (!cursor.callee) {
        cursor.callee = node;

        if ([ 'CallExpression', 'MemberExpression' ].includes(node.type)) {
            stack.push(node);
        }
    } else {
        cursor.arguments.push(node);

        if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression', 'FunctionExpression' ].includes(node.type)) {
            stack.push(node);
        }
    }
}

function VariableDeclarator (node, stack) {
    const cursor = stack[stack.length - 1];

    if (!cursor.id) {
        cursor.id = node;

    } else if (!cursor.init) {
        cursor.init = node;
        if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression', 'FunctionExpression' ].includes(node.type)) {
            cursor._fulfilled = true;
            stack.push(node);
        } else {
            stack.pop();
        }
    }

}

function MemberExpression (node, stack) {
    const cursor = stack[stack.length - 1];
    cursor.object = node;
    cursor._fulfilled = true;
}

function ObjectExpression (node, stack) {
    const cursor = stack[stack.length - 1];
    const next = {
        type: 'Property',
        key: node,
        value: null,
        kind: 'init'
    };
    cursor.properties.push(next);
    stack.push(next);
}

function ArrayExpression (node, stack) {
    const cursor = stack[stack.length - 1];
    cursor.elements.push(node);

    if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression', 'FunctionExpression' ].includes(node.type)) {
        stack.push(node);
    }

}

function Property (node, stack) {
    const cursor = stack[stack.length - 1];

    cursor.value = node;

    if ([ 'CallExpression', 'MemberExpression', 'ObjectExpression', 'ArrayExpression', 'FunctionExpression' ].includes(node.type)) {
        cursor._fulfilled = true;
        stack.push(node);
    } else {
        stack.pop();
    }

}

module.exports = {
    CallExpression,
    VariableDeclarator,
    MemberExpression,
    ObjectExpression,
    ArrayExpression,
    Property
};
