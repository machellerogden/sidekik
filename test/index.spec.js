'use strict';

const chai = require('chai');
const { expect } = chai;

const { tokenizer, compiler } = require('..');

describe('sidekik', () => {
    describe('tokenizer', () => {
        it('works', () => {
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
            expect(tokenizer(input)).to.eql(output);
        });
    });
    describe('compiler', () => {
        it('works', () => {
            const input  = '(foo 123 (bar "baz"))';
            const output = 'foo(123, bar("baz"));';
            expect(compiler(input)).to.equal(output);
        });
    });
});
