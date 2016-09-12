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
        this.allWorkTime = ko.observable(0);

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

        this.updateWorkTimes();

        this.works.subscribe(() => this.updateWorkTimes());
        this.isWorking.subscribe(() => this.updateWorkTimes());

        // interval calc working time

        this.calcWorkTimeIntervalId = null;
        this.isRunningCalcWorkTimeInterval = false;

        this.isWorking.subscribe(isWorking => {
            if (isWorking && !this.isRunningCalcWorkTimeInterval) {
                this.startCalcWorkTimeInterval();
            } else if (!isWorking && this.isRunningCalcWorkTimeInterval) {
                this.stopCalcWorkTimeInterval();
            }
        });

        if (this.isWorking()) {
            setTimeout(() => this.startCalcWorkTimeInterval(), _.random(1, 500));
        }
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

    updateWorkTimes() {
        this.allWorkTime(this.calcAllWorkTime());
        this.lastWorkTime(this.calcLastWorkTime());
    }

    // 作業時間を一定期間おきに計算
    startCalcWorkTimeInterval() {
        if (this.isRunningCalcWorkTimeInterval || this.calcWorkTimeIntervalId) { return; }
        this.isRunningCalcWorkTimeInterval = true;

        this.calcWorkTimeIntervalId = setInterval(() => this.updateWorkTimes(), this.calcAllWorkTime);
    }

    stopCalcWorkTimeInterval() {
        if (this.calcWorkTimeIntervalId) {
            clearInterval(this.calcWorkTimeIntervalId);
        }

        if (!this.isRunningCalcWorkTimeInterval) { return; }
        this.isRunningCalcWorkTimeInterval = false;
    }
}

module.exports = Task;
