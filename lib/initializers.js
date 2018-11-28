'use strict';

function VariableDeclaration(kind) {
    return {
        type: 'VariableDeclaration',
        kind,
        declarations: []
    };
}

function FunctionDeclaration() {
    return {
      type: 'FunctionDeclaration',
      params: [],
      body: {
        type: 'BlockStatement',
        body: []
      }
    };
}

function Identifier(name) {
    return {
        type: 'Identifier',
        name
    };
}

function Literal(value) {
    return {
        type: 'Literal',
        value
    };
}

function CallExpression() {
    return {
        type: 'CallExpression',
        callee: null,
        arguments: []
    };
}

function ObjectExpression() {
    return {
        type: 'ObjectExpression',
        properties: []
    };
}

function ArrayExpression() {
    return {
        type: 'ArrayExpression',
        elements: []
    };
}

function MemberExpression(name) {
    return {
        type: 'MemberExpression',
        object: null,
        property: {
            type: 'Identifier',
            name
        }
    };
}

module.exports = {
    keyword: {
        'const': VariableDeclaration,
        'let': VariableDeclaration,
        'var': VariableDeclaration,
        'function': FunctionDeclaration
    },
    paren: {
        '(': CallExpression
    },
    brace: {
        '{': ObjectExpression
    },
    bracket: {
        '[': ArrayExpression
    },
    key: Identifier,
    name: Identifier,
    init: Identifier,
    member: MemberExpression,
    string: Literal,
    number: Literal
};

