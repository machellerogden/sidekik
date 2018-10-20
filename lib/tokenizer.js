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
            if (chars != null && chars[i] !== '.' && /[a-z]/i.test(chars[i])) {
                let value = '';
                while (chars[i] != null && /[a-z]/i.test(chars[i])) {
                    value += chars[i++];
                }
                yield { type: 'ref', value };
                continue;
            }
            if (chars != null && chars[i] === '.') {
                let value = '';
                i++;
                while (chars[i] != null && /[a-z]/i.test(chars[i])) {
                    value += chars[i++];
                }
                yield { type: 'member', value };
                continue;
            }
            i++;
            continue;
        }
    }
}
