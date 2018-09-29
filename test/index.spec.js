'use strict';

const chai = require('chai');
const { expect } = chai;

const sidekik = require('..');

describe('sidekik', () => {
    it('works', () => {
        const input  = '(foo 123 (bar "baz"))';
        const output = 'foo(123, bar("baz"));';
        expect(sidekik.compiler(input)).to.equal(output);
    });
});
