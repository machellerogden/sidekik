#!/usr/bin/env node
'use strict';

const toStream = require('pull-stream-to-stream');
const pull = require('pull-stream');
const utf8 = require('pull-utf8-decoder');
const split = require('pull-split');

const compiler = require('./lib/compiler');

process.stdin.pipe(toStream.sink(pull(utf8(), split(), compiler()))).pipe(process.stdout);
