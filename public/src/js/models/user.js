'use strict';
const ko = require('knockout');
const _ = require('lodash');
const util = require('../modules/util');

class User {
    constructor(opts) {
        User.columnKeys.forEach(key => this[key] = ko.observable(opts[key]));
        User.memberColumnKeys.forEach(key => this[key] = ko.observable(opts[key]));

        this.projectStages = opts.projectStages;
        this.projectTasks = opts.projectTasks;
        this.projectCosts = opts.projectCosts;

        this.assignedTasks = ko.computed(() => {
            return this.projectTasks().filter(x =>  x.userId() === this.id());
        });

        // this.stages[stage] = 各ステージにある担当task
        // TODO: stageが追加された時の処理
        this.stages = {};
        this.projectStages().forEach(({name: stageName, id: stageId}) => {
            this.stages[stageName] = ko.computed(() => {
                return this.assignedTasks().filter(x => x.stageId() === stageId);
            });
        });

        this.workingTask = ko.computed(() => {
            return this.assignedTasks().find(x => x.isWorking());
        });

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
        this.wip = ko.computed(() => {
            const projectCosts = this.projectCosts();
            const costs = this.assignedTasks().map(task => {
                const costId = task.costId();
                const cost = projectCosts.find(x => x.id() === costId);
                return cost.value();
            });
            return _.sum(costs);
        });

        // 仕掛数MAX
        this.isWipLimited = ko.computed(() => this.wip() >= this.wipLimit());

        // アバターURL
        this.avatarUrl = ko.computed(() => {
            const username = this.username();
            return `/users/${username}/avatar`;
        });
    }

    static get columnKeys() {
        return [
            'id',
            'username'
        ];
    }

    static get memberColumnKeys() {
        return [
            'isVisible',
            'wipLimit'
        ];
    }

    willBeOverWipLimit(addedCost) {
        return this.wip() + addedCost > this.wipLimit();
    }
}

module.exports = User;