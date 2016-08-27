'use strict';
const ko = require('knockout');
const _ = require('lodash');
const User = require('./user');
const Label = require('./label');
const Stage = require('./stage');
const Task = require('./task');
const Cost = require('./cost');
const util = require('../modules/util');

class Project {
    static get columnKeys() {
        return [
            'id',
            'name',
            'enabled',
            'defaultWipLimit',
            'users',
            'stages',
            'costs',
            'tasks',
            'labels',
            'accessLevels',
            'createUser',
            'defaultStage',
            'defaultAccessLevel',
            'defaultCost'
        ];
    }

    constructor(opts) {
        Project.columnKeys.forEach(key => {
            this[key] = ko.observable(opts[key]);
        });

        // initialize labels
        this.labels = ko.observableArray();
        (opts.labels || []).forEach(x => this.addLabel(x));

        // initialize tasks
        this.tasks = ko.observableArray();
        _.reverse(opts.tasks || []).forEach(x => this.addTask(x));

        // initialize users
        this.users = ko.observableArray();
        (opts.users || []).forEach(x => this.addUser(x));

        // initialize stage
        this.stages = ko.observableArray();
        (opts.stages || []).forEach(x => this.addStage(x));

        // initialize costs
        this.costs = ko.observableArray();
        (opts.costs || []).forEach(x => this.addCost(x));

        // this.stages[stageName] = 各ステージにあるTask
        this.stageTasks = {};
        // TODO: stageが追加された時の処理
        this.stages().forEach(({name: stageName}) => {
            this.stageTasks[stageName] = ko.computed(() => {
                return this.tasks().filter(task => task.stage() === stageName);
            });
        });

        // url of kanban board page
        this.url = ko.computed(() => {
            const username = this.createUser().username;
            const id = this.id();
            const name = this.name();
            return `/users/${username}/projects/${id}/${name}`;
        });
    }

    static fetch(id) {
        return Promise.resolve($.ajax({
            url: `/api/projects/${id}`,
            type: 'get',
            dataType: 'json'
        })).then(({project}) => {
            return new Project(project);
        });
    }

    static fetchAll() {
        return Promise.resolve($.ajax({
            url: '/api/projects',
            type: 'get',
            dataType: 'json'
        })).then(({projects}) => {
            return _.sortBy(projects, 'id').map(x => new Project(x));
        });
    }

    static importByGitHub({username, reponame}) {
        return Promise.resolve($.ajax({
            url: '/api/projects',
            type: 'post',
            dataType: 'json',
            data: {username, reponame}
        })).then(({project}) => new Project(project));
    }

    remove() {
        const id = this.id();
        return Promise.resolve($.ajax({
            url: `/api/projects/${id}`,
            type: 'delete',
            dataType: 'json'
        }));
    }

    /*** task ***/

    getTask(taskOrWhere) {
        if (taskOrWhere instanceof Task) { return taskOrWhere; }
        return _.find(this.tasks(), taskOrWhere);
    }

    addTask(taskParams) {
         this.issues.unshift(new Issue(_.extend(taskParams, {
             users: this.users,
             labels: (taskParams.labels || []).map(x => this.getLabelById(x.id))
         })));
    }

    archiveTask(taskOrWhere) {
        const task = this.resolveTask(taskOrWhere);
        const stage = this.getStage({name: 'archive'});
        if (!stage) { throw new Error('archive stage was not found.'); }

        task.stage(stage);
    }

    updateTaskStatus(taskOrWhere, stageOrWhere, userOrWhere) {
        const task = this.getTask(taskOrWhere);
        const stage = this.getStage(stageOrWhere);
        const user = userOrWhere && this.getUser(userOrWhere);
        if (!task) { throw new Error(`task was not found. : ${taskOrWhere}`); }
        if (!stage) { throw new Error(`stage was not found. : ${stageOrWhere}`); }

        task.stage(task);
        task.user(user);
    }

    updateTaskWorkingState(taskOrWhere, isWorking) {
        const task = this.getTask(taskOrWhere);
        if (!task) { throw new Error(`task was not found. : ${taskOrWhere}`); }

        task.isWorking(isWorking);
    }

    updateTaskWorkHistory(taskOrWhere, workHistory) {
        const task = this.getTask(taskOrWhere);
        if (!task) { throw new Error(`task was not found. : ${taskOrWhere}`); }

        task.updateWorkHistory(workHistory);
    }

    updateTaskOrder(taskOrWhere, beforeTaskOrWhere) {
        const task = this.getTask(taskOrWhere);
        if (!task) { throw new Error(`task was not found. : ${taskOrWhere}`); }

        if (beforeTaskOrWhere) {
            const beforeTask = this.getTask(beforeTaskOrWhere);
            if (!beforeTask) { throw new Error(`beforeTask was not found. : ${beforeTaskOrWhere}`); }

            util.moveToBefore(this.tasks, task, beforeTask);
        } else {
            util.moveToBefore(this.tasks, task, null);
        }
    }

    /*** user ***/

    getUser(userOrWhere) {
        if (userOrWhere instanceof User) { return userOrWhere; }
        return _.find(this.users(), userOrWhere);
    }

    addUser(userParam) {
        this.users.unshift(new User(_.extend(userParams)));
    }

    removeUser(userOrWhere) {
        const user = this.getUser(userOrWhere);
        if (!user) { throw new Error(`user was not found. : ${userOrWhere}`); }

        this.users.remove(user);
    }

    updateUser(userOrWhere, updateParams) {
        const user = this.getUser(userOrWhere);
        if (!user) { throw new Error(`user was not found. : ${userOrWhere}`); }

        _.forEach(updateParams, (val, key) => {
            if (ko.isObservable(user[key])) {
                user[key](val);
            }
        });
    };

    updateUserOrder(userOrWhere, beforeUserOrWhere) {
        const user = this.getUser(userOrWhere);
        if (!user) { throw new Error(`user was not found. : ${userOrWhere}`); }

        if (beforeUserOrWhere) {
            const beforeUser = this.getUser(beforeUserOrWhere);
            if (!beforeUser) { throw new Error(`beforeUser was not found. : ${beforeUserOrWhere}`); }

            util.moveToBefore(this.users, user, beforeUser);
        } else {
            util.moveToBefore(this.users, user, null);
        }
    }

    /*** label ***/

    getLabel(labelOrWhere) {
        if (labelOrWhere instanceof Label) { return labelOrWhere; }
        return _.find(this.labels(), labelOrWhere);
    }

    addLabel(labelParams) {
        this.labels.push(new Label(labelParams));
    }

    attachLabel(taskOrWhere, labelOrWhere) {
        const task = this.getTask(taskOrWhere);
        if (!task) { throw new Error(`task was not found. : ${taskOrWhere}`); }
        const label = this.getLabel(labelOrWhere);
        if (!label) { throw new Error(`label was not found. : ${labelOrWhere}`); }

        task.attachLabel(label); // TODO: task#attachLabel
    }

    detachLabel(taskOrWhere, labelOrWhere) {
        const task = this.getTask(taskOrWhere);
        if (!task) { throw new Error(`task was not found. : ${taskOrWhere}`); }
        const label = this.getLabel(labelOrWhere);
        if (!label) { throw new Error(`label was not found. : ${labelOrWhere}`); }

        task.detachLabel(label);  // TODO: task#detachLabel
    }

    replaceLabelAll(newLabels, newTasks) {
        throw new Error('replaceLabelAll is unsupported.');
        // this.labels.splice(0, this.labels.slice().length, newLabels.map(function (x) { return new model.Label(x); }));
        // O(N^2) なので O(NlogN)に抑える
        // newIssues.forEach(function (newIssue) {
        //     var issue = this.getIssue(newIssue._id);
        //     if (!issue) { return console.error('issue not found'); }
        //     issue.labels.splice(0, issue.labels().length,
        //         newIssue.labels.map(function (labelId) { return this.getLabel(labelId); }, this));
        // }, this);
    }

    /*** stage ***/

    getStage(stageOrWhere) {
        if (stageOrWhere instanceof Stage) { return stageOrWhere; }
        return _.find(this.stages(), stageOrWhere);
    }

    addStage(stageParams) {
        this.stages.push(new Stage(stageParams));
    }

    /*** costs ***/

    getCost(costOrWhere) {
        if (costOrWhere instanceof Cost) { return costOrWhere; }
        return _.find(this.costs(), costOrWhere);
    }

    addCost(costParams) {
        this.costs.push(new Cost(costParams));
    }

}

module.exports = Project;