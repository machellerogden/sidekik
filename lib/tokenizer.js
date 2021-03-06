'use strict';

module.exports = tokenizer;

async function* tokenizer(lines) {

    for await (const line of lines) {

        const chars = line.split('');

        let i = 0;
        while (i < chars.length) {

            if ([ '(', ')' ].includes(chars[i])) {
                yield { type: 'paren', value: chars[i++] };
                continue;
            }

            if ([ '{', '}' ].includes(chars[i])) {
                yield { type: 'brace', value: chars[i++] };
                continue;
            }

            if ([ '[', ']' ].includes(chars[i])) {
                yield { type: 'bracket', value: chars[i++] };
                continue;
            }

            if (/[\s\,]/.test(chars[i])) { // comma counts as whitespace
                i++;
                yield { type: 'whitespace' };
                continue;
            }

            if (chars[i] === ';') {
                let value = '';
                while (chars[i]) {
                    value += chars[i++];
                }
                yield { type: 'comment', value };
                continue;
            }

            if (/[0-9]/.test(chars[i])) {
                let value = '';
                while (/[0-9]/.test(chars[i])) {
                    value += chars[i++];
                }
                yield { type: 'number', value: Number(value) };
                continue;
            }

            if (chars[i] === "'") {
                i++;
                let value = '';
                while (chars[i] !== "'" || chars[i - 1] === '\\') value += chars[i++];
                i++;

                yield { type: 'string', value };
                continue;
            }

            if (chars[i] === '"') {
                i++;
                let value = '';
                while (chars[i] !== '"' || chars[i - 1] === '\\') value += chars[i++];
                i++;

                yield { type: 'string', value };
                continue;
            }

            if (chars[i] === '.') {
                let value = '';
                i++;
                while (chars[i] != null && /[a-z]/i.test(chars[i])) {
                    value += chars[i++];
                }
                yield { type: 'member', value };
                continue;
            }

            if (chars[i] === ':') {
                let value = '';
                i++;
                while (chars[i] != null && /[a-z]/i.test(chars[i])) {
                    value += chars[i++];
                }
                yield { type: 'key', value };
                continue;
            }

            if (/[a-z]/i.test(chars[i])) {
                let value = '';
                while (chars[i] != null && /[a-z]/i.test(chars[i])) {
                    value += chars[i++];
                }
                if ([ 'const', 'let', 'var', 'function' ].includes(value)) {
                    yield { type: 'keyword', value };
                } else {
                    yield { type: 'name', value };
                }
                continue;
            }

            i++;

        }
    }
}
