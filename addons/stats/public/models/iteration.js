'use strict';
const ko = require('knockout');

class Iteration {
    constructor (opts) {
        this.opts = opts;

        Iteration.columnKeys.forEach(key => { this[key] = ko.observable(opts[key]); });
    }

    update ({startTime, endTime}) {
        this.startTime(startTime);
        this.endTime(endTime);
    }

    static get columnKeys () {
        return [
            'id',
            'startTime',
            'endTime'
        ];
    }

}

module.exports = Iteration;
