#!/usr/bin/env node
'use strict';

const { pipe } = require('needful');
const streamify = require('async-stream-generator');
const compiler = require('./lib/compiler');
const { linebreak } = require('./lib/util');

if (process.stdin.isTTY) {

    require('repl').start({
        input: pipe(compiler, linebreak, streamify)(process.stdin),
        output: process.stdout
    });

} else {

    try {
        pipe(compiler, streamify)(process.stdin).pipe(process.stdout);
    } catch (e) {
        console.log(e && e.message || e);
    }

}
