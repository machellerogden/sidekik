'use strict';

const test = require('tape-async');

const { tokenizer, compiler } = require('..');

test('tokenizer', async (t) => {
    const input  = '(foo 123 (bar "baz"))';
    const output = [ {
        type: 'paren',
        value: '('
    }, {
        type: 'name',
        value: 'foo'
    }, {
        type: 'whitespace'
    }, {
        type: 'number',
        value: 123
    }, {
        type: 'whitespace'
    }, {
        type: 'paren',
        value: '('
    }, {
        type: 'name',
        value: 'bar'
    }, {
        type: 'whitespace'
    }, {
        type: 'string',
        value: 'baz'
    }, {
        type: 'paren',
        value: ')'
    }, {
        type: 'paren',
        value: ')'
    } ];
    let i = 0;
    for await (const token of tokenizer([ input ])) {
        t.deepEqual(token, output[i]);
        i++;
    }
    t.end();
});

test('compiler', async (t) => {
    const input  = `(foo 123 (bar (foo 123 (bar "baz"))))
(foo 123 (bar "baz"))
(const foo "bar")`;
    const output = [
        'foo(123, bar(foo(123, bar("baz"))));',
        'foo(123, bar("baz"));',
        'const foo = "bar";'
    ];
    let i = 0;
    for await (const result of compiler([ input ])) {
        t.deepEqual(result, output[i]);
        i++;
    }
    t.end();
});

