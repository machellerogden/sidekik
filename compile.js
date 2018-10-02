#!/usr/bin/env node
'use strict';

const pull = require('pull-stream');

const tokenizer = require('./lib/tokenizer');
const parser = require('./lib/parser');

const { inspect } = require('util');
const log = pull.drain(v => console.log(inspect(v, { depth: null, colors: true })));

pull(tokenizer(), parser(), log);
