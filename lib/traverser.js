'use strict';

module.exports = traverser;

function traverser(ast, visitor) {

    function traverseArray(array, parent) {
        array.forEach(child => {
            traverseNode(child, parent);
        });
    }

    function traverseNode(node, parent) {
        let methods = visitor[node.type];

        if (methods && methods.enter) methods.enter(node, parent);

        switch (node.type) {

            case 'Program':
                traverseArray(node.body, node);
                break;

            case 'CallExpression':
                traverseArray(node.arguments, node);
                break;

            case 'VariableDeclaration':
                traverseArray(node.declarations, node);
                break;

            case 'ObjectExpression':
                traverseArray(node.properties, node);
                break;

            case 'ArrayExpression':
                traverseArray(node.elements, node);
                break;

            case 'FunctionDeclaration':
                traverseArray(node.params, node);
                traverseArray(node.body.body, node);
                break;

            case 'Identifier':
            case 'Literal':
            case 'VariableDeclarator':
            case 'Property':
                break;

            default:
                throw new TypeError(node.type);
        }

        if (methods && methods.exit) methods.exit(node, parent);
    }

    traverseNode(ast, null);
}
