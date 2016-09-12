'use strict';
const ko = require('knockout');
const _ = require('lodash');
const util = require('../modules/util');

class Task {
    constructor(opts) {
        Task.columnKeys.forEach(key => this[key] = ko.observable(opts[key]));

        this.labels = ko.observableArray(opts.labels);
        this.works = ko.observableArray(opts.works || []);

        this.isVisible = ko.observable(true); // local

        this.displayTitle = ko.computed(() => this.title());

        // 合計作業時間 (ms)
        this.allWorkTime = ko.observable(this.calcAllWorkTime());

        // 合計作業時間 (h時間m分)
        this.allWorkTimeFormat = ko.computed(() => {
            return util.dateFormatHM(this.allWorkTime());
        });

        // 最後の作業時間
        this.lastWorkTime = ko.observable(0);

        // 検索用テキスト
        this.textForSearch = ko.computed(() => {
            const res = [this.title(), this.body()];

            // cost
            const cost = this.cost();
            if (cost) {
                const value = cost.value();
                res.push(`cost:${value}`);
            }

            // label
            this.labels().forEach(label => {
                const name = label.name();
                res.push(`label:${name}`);
            });

            return res.join(' ');
        });

        this.startCalcWorkTimeInterval()
    }

    static get columnKeys() {
        return [
            'id',
            'title',
            'body',
            'isWorking',
            'stage',
            'user',
            'cost',
            'labels',
            'works'
        ];
    }

    static get calcAllWorkingIntervalTime() {
        return  1000 * 20; // 20 seconds
    }

    calcAllWorkTime() {
        const times = this.works().map(x => x.calcDuration());
        return _.sum(times);
    }

    // 最後の作業時間を計算
    calcLastWorkTime() {
        const works = this.works();
        return works.length ? works[works.length - 1].calcDuration(true) : 0;
    }

    // 作業時間を一定期間おきに計算
    // ただし、いくつものTaskが同時に計算しないように最初にランダムにwaitを入れる
    startCalcWorkTimeInterval() {
        let timeoutId = null;
        const calcAllWorkTimeIntervalFunc = () => {
            this.allWorkTime(this.calcAllWorkTime());
            this.lastWorkTime(this.calcLastWorkTime());

            if (this.isWorking()) {
                timeoutId = setTimeout(calcAllWorkTimeIntervalFunc, Task.calcAllWorkingIntervalTime + _.random(-5000, 5000));
            } else if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        };

        this.works.subscribe(() => {
            this.allWorkTime(this.calcAllWorkTime());
            this.lastWorkTime(this.calcLastWorkTime());
        });

        this.isWorking.subscribe(() => {
            this.allWorkTime(this.calcAllWorkTime());
            this.lastWorkTime(this.calcLastWorkTime());
        });

        if (this.isWorking()) {
            timeoutId = setTimeout(calcAllWorkTimeIntervalFunc, Task.calcAllWorkingIntervalTime + _.random(-5000, 5000));
        }
    }
}

module.exports = Task;
