#!/usr/bin/env node

'use strict';

const { pipe } = require('needful');
const streamify = require('async-stream-generator');
const matchers = require('./lib/matchers');

async function* split(chunks) {
    let previous = '';

    for await (const chunk of chunks) {
        previous += chunk;
        let eolIndex;

        while ((eolIndex = previous.indexOf('\n')) >= 0) {
            const line = previous.slice(0, eolIndex);
            yield line;
            previous = previous.slice(eolIndex + 1);
        }
    }

    if (previous.length > 0) {
        yield previous;
    }
}

async function* tap(chunks) {
    for await (const chunk of chunks) {
        console.log(chunk);
        yield chunk;
    }
}

async function* stringify(chunks) {
    for await (const chunk of chunks) {
        yield JSON.stringify(chunk);
    }
}

async function* tokenize(lines) {
    for await (const line of lines) {
        const chars = line.split('');
        let i = 0;
        while (i < chars.length) {
            if ([ '(', ')' ].includes(chars[i])) {
                yield { type: 'paren', value: chars[i++] };
                continue;
            }
            if (/\s/.test(chars[i])) {
                i++;
                yield { type: 'whitespace' };
                continue;
            }
            if (/[0-9]/.test(chars[i])) {
                let value = '';
                while (/[0-9]/.test(chars[i])) {
                    value += chars[i++];
                }
                yield { type: 'number', value };
                continue;
            }
            if ('"' === chars[i]) {
                let value = '';
                i++;
                while (chars[i] !== '"' || chars[i - 1] === '\\') {
                    value += chars[i++];
                }
                i++;
                yield { type: 'string', value };
                continue;
            }
            if (chars != null && /[a-z]/i.test(chars[i])) {
                let value = '';
                while (chars[i] != null && /[a-z]/i.test(chars[i])) {
                    value += chars[i++];
                }
                yield { type: 'ref', value };
                continue;
            }
            i++;
            continue;
        }
    }
}

pipe(split, tokenize, /*tap,*/ stringify, streamify)(process.stdin).pipe(process.stdout);
