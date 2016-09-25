'use strict';
const ko = require('knockout');
const _ = require('lodash');

class Label {
    constructor (opts) {
        Label.columnKeys.forEach(key => { this[key] = ko.observable(opts[key]); });

        // colorに対して見やすい文字色（白or黒）
        this.invertMonoColor = ko.computed(() => {
            const color = parseInt(this.color(), 16);
            const mono = Math.floor(((color & 0xff) + (color >> 8 & 0xff) + (color >> 16 & 0xff)) / 3);
            const invert = mono < 0x88 ? 0xff : 0x00;
            const invert16 = _.padStart(invert.toString(16), 2, '0');
            return invert16 + invert16 + invert16;
        });
    }

    static get columnKeys () {
        return [
            'id',
            'name',
            'color'
        ];
    }
}

module.exports = Label;
