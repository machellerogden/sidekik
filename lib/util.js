'use strict';

exports.linebreak = linebreak;
exports.split = split;
exports.tap = tap;

async function* linebreak(statements) {
    for await (const statement of statements) {
        yield `${statement}\n`;
    }
}

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
        console.log('\n', require('util').inspect(chunk, { depth: null, colors: true }), '\n');
        yield chunk;
    }
}
