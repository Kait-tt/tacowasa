'use strict';
const _ = require('lodash');
const QUOTES = '\'"';
const WHITE_SPACE = ' ';
const REGEX_PTN = /^\/(.*)\/(.*)$/;
const REGEX_FLAGS = 'gimuy';

class TaskSearchQuery {
    constructor (searchText) {
        this.parseSearchText(_.isString(searchText) ? searchText.trim() : '');
    }

    hit (text) {
        return this.queries.every(fn => fn(text));
    }

    pushQuery () {
        const str = this._str;
        if (str.length) {
            const regex = this.createRegex(str);
            if (regex) {
                this.queries.push(x => regex.test(x));
            } else {
                this.queries.push(x => x.includes(str));
            }
        }
        this._str = '';
        this._quote = null;
    }

    createRegex (str) {
        const matched = str.match(REGEX_PTN);
        if (!matched) { return null; }
        try {
            const flags = matched[2].split('').filter(x => REGEX_FLAGS.includes(x)).join('');
            return new RegExp(matched[1], flags);
        } catch (e) {
            return null;
        }
    }

    parseSearchText (searchText) {
        this.queries = [];
        this._quote = null;
        this._str = '';

        searchText.split('').forEach(c => {
            if (c === this._quote || (!this._quote && c === WHITE_SPACE)) {
                this.pushQuery();
            } else if (!this._str && QUOTES.includes(c)) {
                this._quote = c;
            } else {
                this._str += c;
            }
        });

        if (this._str) {
            this.pushQuery();
        }
    }
}

module.exports = TaskSearchQuery;
