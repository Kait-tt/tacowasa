'use strict';
const ko = require('knockout');
const util = require('../modules/util');

class User {
    constructor (opts) {
        User.columnKeys.forEach(key => { this[key] = ko.observable(opts[key]); });
        User.memberColumnKeys.forEach(key => { this[key] = ko.observable(opts.member[key]); });

        this.workingTask = ko.observable(false);

        // 作業開始からどのくらいの時間がたっているか
        this.workingTime = ko.computed(() => {
            const task = this.workingTask();
            return task ? task.lastWorkTime() : 0;
        });

        // 作業開始からどのくらいの時間がたっているか (h時間m分)
        this.workingTimeFormat = ko.computed(() => {
            return util.dateFormatHM(this.workingTime());
        });

        // 仕掛数
        this.wip = ko.observable(0);

        // 仕掛数MAX
        this.isWipLimited = ko.computed(() => this.wip() >= this.wipLimit());

        // アバターURL
        this.avatarUrl = ko.computed(() => {
            const username = this.username();
            return `/users/${username}/avatar`;
        });

        // 検索結果のタスクを持っているか
        this.hasSearchTask = ko.observable(true);
    }

    static get columnKeys () {
        return [
            'id',
            'username'
        ];
    }

    static get memberColumnKeys () {
        return [
            'isVisible',
            'wipLimit'
        ];
    }

    willBeOverWipLimit (addedCost) {
        return this.wip() + addedCost > this.wipLimit();
    }
}

module.exports = User;
