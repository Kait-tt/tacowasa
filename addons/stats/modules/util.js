'use strict';
const _ = require('lodash');

class Util {
    static calcWorkTime (work, now = new Date()) {
        const end = work.isEnded ? new Date(work.endTime) : now;
        const start = new Date(work.startTime);
        return Number(end - start);
    }

    static calcSumWorkTime (works, now = new Date()) {
        return _.chain(works)
            .map(x => Util.calcWorkTime(x, now))
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
