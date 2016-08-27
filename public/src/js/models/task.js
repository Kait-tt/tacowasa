'use strict';
const ko = require('knockout');
const _ = require('lodash');
const util = require('../modules/util');
const Work = require('./work');

class Task {
    constructor(opts) {
        Task.columnKeys.forEach(key => this[key] = ko.observable(opts[key]));

        this.projectLabels = opts.projectLabels;
        this.projectUsers = opts.projectUsers;
        this.projectCosts = opts.projectCosts;
        this.projectStages = opts.projectStages;

        this.labelIds = ko.observableArray(opts.labelIds || []);
        this.labels = ko.computed(() => {
            const projectLabels = this.projectLabels();
            return this.labelIds().map(id => projectLabels.find(x => x.id() === id));
        });
        this.user = ko.computed(() => {
            const userId = this.userId();
            return this.projectUsers().find(x => x.id() === userId);
        });
        this.cost = ko.computed(() => {
            const costId = this.costId();
            return this.projectUsers().find(x => x.id() === costId);
        });
        this.stage = ko.computed(() => {
            const stageId = this.stageId();
            return this.projectStages().find(x => x.id() === stageId);
        });
        this.works = ko.observableArray();
        this.updateWorkHistory(opts.works || []);

        this.isVisible = ko.observable(true);


        this.displayTitle = ko.computed(() => {
            let title = this.title();
            // TODO: github
            // if (this.github() && this.github().number && this.github().number !== '0') {
            //     title = '#' + this.github().number + ' ' + title;
            // }
            return title;
        });

        // 合計作業時間 (ms)
        this.allWorkTime = ko.observable(this.calcAllWorkTime());

        // 合計作業時間 (h時間m分)
        this.allWorkTimeFormat = ko.computed(() => {
            return util.dateFormatHM(this.allWorkTime());
        });

        // 最後の作業時間
        this.lastWorkTime = ko.observable(0);

        // 最後の作業時間を計算


        // TODO: 検索用の名前という事に変更
        this.alltext = ko.computed(() => {
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
            'title',
            'body',
            'isWorking',
            'stageId',
            'userId',
            'costId',
            'labelIds',
            'works'
        ];
    }

    static get calcAllWorkingIntervalTime() {
        return  1000 * 20; // 20 seconds
    }

    updateWorkHistory(newWorkHistory) {
        this.works(newWorkHistory.map(x => new Work(_.extends(x, {
            projectUsers: this.projectUsers
        }))));
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

        this.workHistory.subscribe(() => {
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
