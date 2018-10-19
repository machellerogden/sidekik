'use strict';

const test = require('tape-async');

const { tokenizer, compiler } = require('..');

test('tokenizer', async function (t) {
    const input  = '(foo 123 (bar "baz"))';
    const output = [ {
        type: 'paren',
        value: '('
    }, {
        type: 'ref',
        value: 'foo'
    }, {
        type: 'whitespace'
    }, {
        type: 'number',
        value: '123'
    }, {
        type: 'whitespace'
    }, {
        type: 'paren',
        value: '('
    }, {
        type: 'ref',
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
    for await (const result of tokenizer([ input ])) {
        t.deepEqual(result, output);
    }
    t.end();
});

//test('compiler', function (t) {
    //const input  = '(foo 123 (bar "baz"))';
    //const output = 'foo(123, bar("baz"));';
    //pull(
        //pull.values([ input ]),
        //compiler(),
        //pull.collect((err, ary) => {
            //t.notOk(err);
            //t.deepEqual(ary, output);
            //t.end();
        //})
    //);
//});

