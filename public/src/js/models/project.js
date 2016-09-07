'use strict';
const ko = require('knockout');
const _ = require('lodash');
const User = require('./user');
const Label = require('./label');
const Stage = require('./stage');
const Task = require('./task');
const Cost = require('./cost');
const Work = require('./work');
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
            //'defaultAccessLevel',
            'defaultCost',
            'createdAt',
            'updatedAt'
        ];
    }

    constructor(opts) {
        Project.columnKeys.forEach(key => this[key] = ko.observable(opts[key]));

        // array init
        this.stages = ko.observableArray();
        this.costs = ko.observableArray();
        this.labels = ko.observableArray();
        this.users = ko.observableArray();
        this.tasks = ko.observableArray();

        (opts.stages || []).forEach(x => this.addStage(x));
        (opts.costs || []).forEach(x => this.addCost(x));
        (opts.labels || []).forEach(x => this.addLabel(x));
        _.reverse(opts.users || []).forEach(x => this.addUser(x));
        _.reverse(opts.tasks || []).forEach(x => this.addTask(x));

        // defaultValue init
        this.defaultStage = ko.computed(() => this.stages().find(x => x.id() === opts.defaultStage.id));
        this.defaultCost = ko.computed(() => this.costs().find(x => x.id() === opts.defaultCost.id));
        this.defaultStage = ko.computed(() => this.stages().find(x => x.id() === opts.defaultStage.id));
        this.defaultCost = ko.computed(() => this.costs().find(x => x.id() === opts.defaultCost.id));

        // getTasksのmemo
        this.memoGetTasks = {};

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
            return _.reverse(_.sortBy(projects, 'updatedAt')).map(x => new Project(x));
        });
    }

    static create({projectName}) {
        return Promise.resolve($.ajax({
            url: '/api/projects',
            type: 'post',
            dataType: 'json',
            data: {projectName}
        })).then(({project}) => new Project(project));
    }

    static importByGitHub({username, reponame}) {
        return Promise.resolve($.ajax({
            url: '/api/projects/importByGitHub',
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
        return this.tasks().find(task => {
            return _.every(taskOrWhere, (whereValue, whereKey) => {
                const val = ko.unwrap(task[whereKey]);
                return val === whereValue;
            });
        });
    }

    getTasks({userOrWhere=null, stageOrWhere=null}={}) {
        const user = userOrWhere && this.getUser(userOrWhere);
        const stage = stageOrWhere && this.getStage(stageOrWhere);
        const userKey = user ? user.id() : '(none)';
        const stageKey = stage ? stage.id() : '(none)';
        const key = `${userKey}__${stageKey}`;
        if (!this.memoGetTasks[key]) {
            this.memoGetTasks[key] = ko.computed(() => {
                return this.tasks().filter(task => {
                    return (!user || task.user() === user) && (!stage || task.stage() === stage);
                });
            });
        }
        return this.memoGetTasks[key];
    }

    addTask(taskParams) {
        taskParams.labels = (taskParams.labels || []).map(x => this.getLabel({id: x.id}));
        taskParams.user = taskParams.user && this.getUser({id: taskParams.user.id});
        taskParams.cost = taskParams.cost && this.getCost({id: taskParams.cost.id});
        taskParams.stage = taskParams.stage && this.getStage({id: taskParams.stage.id});
        taskParams.works = (taskParams.works || []).map(workParams => {
            return workParams.user && this.getUser({id: workParams.user.id});
        });
        const task = new Task(taskParams);

        // update user#workingTask and user#wip
        const user = task.user();
        if (user) {
            user.workingTask(task);
            user.wip(user.wip() + task.cost().value());
        }

        this.tasks.unshift(task);
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
        if (userOrWhere && !user) { throw new Error(`user was not found. : ${userOrWhere}`); }

        task.stage(stage);
        task.user(user);
    }

    updateTaskContent(taskOrWhere, title, body, costOrWhere) {
        const task = this.getTask(taskOrWhere);
        if (!task) { throw new Error(`task was not found. : ${taskOrWhere}`); }
        const cost = this.getCost(costOrWhere);
        if (!cost) { throw new Error(`cost was not found. : ${costOrWhere}`); }

        task.title(title);
        task.body(body);
        task.cost(cost);
    }

    updateTaskWorkingState(taskOrWhere, isWorking) {
        const task = this.getTask(taskOrWhere);
        if (!task) { throw new Error(`task was not found. : ${taskOrWhere}`); }
        const user = task.user();
        if (!user) { throw new Error(`not assigned task cannot update working state. : ${taskOrWhere}`); }

        task.isWorking(isWorking);
        if (isWorking) {
            user.workingTask(task);
        } else {
            user.workingTask(null);
        }
    }

    updateTaskWorkHistory(taskOrWhere, works) {
        const task = this.getTask(taskOrWhere);
        if (!task) { throw new Error(`task was not found. : ${taskOrWhere}`); }

        const workInstances = works.map(work => {
            work.user = work.user && this.getUser({id: work.user.id});
            return new Work(work);
        });
        task.works(workInstances);
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
        return this.users().find(user => {
            return _.every(userOrWhere, (whereValue, whereKey) => {
                const val = ko.unwrap(user[whereKey]);
                return val === whereValue;
            });
        });
    }

    addUser(userParam) {
        this.users.unshift(new User(_.extend(userParam, {
            projectTasks: this.tasks,
            projectStages: this.stages,
            projectCosts: this.costs
        })));
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
        return this.labels().find(label => {
            return _.every(labelOrWhere, (whereValue, whereKey) => {
                const val = ko.unwrap(label[whereKey]);
                return val === whereValue;
            });
        });
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
        return this.stages().find(stage => {
            return _.every(stageOrWhere, (whereValue, whereKey) => {
                const val = ko.unwrap(stage[whereKey]);
                return val === whereValue;
            });
        });
    }

    addStage(stageParams) {
        this.stages.push(new Stage(stageParams));
    }

    /*** costs ***/

    getCost(costOrWhere) {
        if (costOrWhere instanceof Cost) { return costOrWhere; }
        return this.costs().find(cost => {
            return _.every(costOrWhere, (whereValue, whereKey) => {
                const val = ko.unwrap(cost[whereKey]);
                return val === whereValue;
            });
        });
    }

    addCost(costParams) {
        this.costs.push(new Cost(costParams));
    }

}

module.exports = Project;
