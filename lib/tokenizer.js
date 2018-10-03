'use strict';

const pull = require('pull-stream');

const matchers = require('./matchers');

module.exports = () => pull((read) => (end, cb) => read(end, (end, data) => {
    return cb(end, data != null
        ? data.split('').reduce((tokens, char, i, chars) => {
            const result = matchers.reduce((token, fn) => token || fn(chars, i), null);
            if (!result) cb(new TypeError(`Unknown Token: ${char}`));
            const { token, idx } = result;
            const consumed = idx - i - 1;
            if (consumed) chars.splice(i, consumed);
            if (token == null) return tokens;
            return [ ...tokens, token ];
          }, [])
        : null);
}), pull.flatten());
