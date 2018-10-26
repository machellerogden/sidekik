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
            if (/\s/.test(chars[i])) {
                i++;
                yield { type: 'whitespace' };
                continue;
            }
            if (/#/.test(chars[i])) {
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
                yield { type: 'keyword', value };
                continue;
            }
            if (/[a-z]/i.test(chars[i])) {
                let value = '';
                while (chars[i] != null && /[a-z]/i.test(chars[i])) {
                    value += chars[i++];
                }
                if ([ 'const', 'let', 'var' ].includes(value)) {
                    yield { type: 'kind', value };
                } else {
                    yield { type: 'name', value };
                }
                continue;
            }

            // WIP - opting not to tokenize but instead let parser handle this. leaving this for the moment because we need to sort out the depth issue
            //if (chars[i] === '{') {
                //let value = '{';
                //let depth = 1;
                //i++;
                //while (chars[i] != null) {
                    //value += chars[i++];
                    //if (chars[i] === '{') depth++;
                    //if (chars[i] === '}') depth--;
                    //if (depth === 0) break;
                //}
                //yield { type: 'object', value };
                //continue;
            //}
            //if (chars[i] === '[') {
                //let value = '[';
                //let depth = 1;
                //i++;
                //while (chars[i] != null) {
                    //value += chars[i++];
                    //if (chars[i] === '[') depth++;
                    //if (chars[i] === ']') depth--;
                    //if (depth === 0) break;
                //}
                //yield { type: 'object', value };
                //continue;
            //}
            i++;
            continue;
        }
    }
}
