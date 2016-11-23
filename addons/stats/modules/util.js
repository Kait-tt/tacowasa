'use strict';
const _ = require('lodash');

class Util {
    static calcSumWorkTime (works) {
        const now = new Date();
        return _.chain(works)
            .map(x => {
                const end = x.isEnded ? new Date(x.endTime) : now;
                const start = new Date(x.startTime);
                return Number(end - start);
            })
            .sum()
            .value();
    }
}

module.exports = Util;
