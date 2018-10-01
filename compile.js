#!/usr/bin/env node
'use strict';

const pull = require('pull-stream');

const tokenizer = require('./lib/tokenizer');

pull(tokenizer, pull.drain(console.log));
