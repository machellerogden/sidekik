#!/usr/bin/env node
'use strict';

const { pipe } = require('needful');
const streamify = require('async-stream-generator');
const compiler = require('./lib/compiler');
const split = require('./lib/split');

if (process.stdin.isTTY) {

    async function* linebreak(statements) {
        for await (const statement of statements) {
            yield `${statement}\n`;
        }
    }

    require('repl').start({
        input: pipe(split, compiler, linebreak, streamify)(process.stdin),
        output: process.stdout
    });

} else {

    try {
        pipe(split, compiler, streamify)(process.stdin).pipe(process.stdout);
    } catch (e) {
        console.log(e && e.message || e);
    }

}
