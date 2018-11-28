'use strict';

const test = require('tape-async');

const { tokenizer, compiler } = require('..');

test('tokenizer', async t => {
    t.plan(11);
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

test('compiler', async t => {
    t.plan(3);
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

test('calling member functions with objects and arrays', async t => {
    t.plan(1);
    const input  = `(.log console {:foo "bar"} [ "a" "b" ])`;
    const output = [
        'console.log({ foo: "bar" }, [ "a", "b" ]);'
    ];
    let i = 0;
    for await (const result of compiler([ input ])) {
        t.deepEqual(result, output[i]);
        i++;
    }
    t.end();
});

test('declaring objects and arrays', async t => {
    t.plan(2);
    const input  = `(const foo {:foo "bar"})
(let bar [ 1 2 3 ])`;
    const output = [
        'const foo = { foo: "bar" };',
        'let bar = [ 1, 2, 3 ];'
    ];
    let i = 0;
    for await (const result of compiler([ input ])) {
        t.deepEqual(result, output[i]);
        i++;
    }
    t.end();
});

test('function declaration', async t => {
    t.plan(1);
    const input  = `(function echo [x] x)`;
    const output = [
        'function echo (x) { return x; }'
    ];
    let i = 0;
    for await (const result of compiler([ input ])) {
        t.deepEqual(result, output[i]);
        i++;
    }
    t.end();
});

//test('declarative assignment of function expression', async t => {
    //t.plan(1);
    //const input  = `(const echo (function [x] x))`;
    //const output = [
        //'const foo = function (x) { return x; };'
    //];
    //let i = 0;
    //for await (const result of compiler([ input ])) {
        //t.deepEqual(result, output[i]);
        //i++;
    //}
    //t.end();
//});
