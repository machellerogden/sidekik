#!/usr/bin/env node
'use strict';

const pull = require('pull-stream');

const tokenizer = require('./lib/tokenizer');
const parser = require('./lib/parser');

pull(tokenizer(), parser(), pull.drain(console.log));
