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

    static lowerBound (ary, value) {
        if (!ary.length) { return 0; }
        let count = ary.length;
        let base = 0;

        while (count) {
            const step = Math.floor(count / 2);
            const pos = base + step;
            if (ary[pos] < value) {
                base = pos + 1;
                count -= step + 1;
            } else {
                count = step;
            }
        }

        return base;
    }

    static upperBound (ary, value) {
        if (!ary.length) { return 0; }
        let count = ary.length;
        let base = 0;

        while (count) {
            const step = Math.floor(count / 2);
            const pos = base + step;
            if (ary[pos] <= value) {
                base = pos + 1;
                count -= step + 1;
            } else {
                count = step;
            }
        }

        return base;
    }
}

module.exports = Util;
