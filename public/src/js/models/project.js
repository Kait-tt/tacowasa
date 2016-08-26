'use strict';
const ko = require('knockout');
const _ = require('lodash');
// const User = require('./user');
// const Label = require('./label');
// const Stage = require('./stage');

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
            // TODO github ?
            // githubColumnKeys = [
            //     'userName',
            //     'repoName',
            //     'url',
            //     'sync'
            // ];
        ];
    }

    constructor(opts) {
        Project.columnKeys.forEach(key => {
            this[key] = ko.observable(opts[key]);
            // if (!this.github()) { this.github({}); }
            // githubColumnKeys.forEach(function (key) {
            //     this.github()[key] = ko.observable(o.github ? o.github[key] : null);
            // }, this);
        });

        // initialize labels
        this.labels = ko.observableArray();
        (opts.labels || []).forEach(x => this.addLabel(x));

        // initialize tasks
        this.tasks = ko.observableArray();
        _.reverse(opts.tasks || []).forEach(x => this.addTask(x));

        // initialize users
        this.users = ko.observableArray();
        (opts.users || []).forEach(x => this.addUser(x, {reverse: true}));

        // this.stages[stageName] = 各ステージにあるTask
        this.stageTasks = {};
        this.stages().forEach(({stageName}) => {
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

    addTask(taskParams) {
        // this.issues.unshift(new Issue(_.extend(issue, {
        //     members: this.members,
        //     labels: issue.labels.map(function (labelId) { return this.getLabel(labelId); }, this)
        // })));
    }

    archiveTask(taskOrId) {
        // issue.stage(stageTypes.archive.name);
    }

    getTaskById(taskId) {
        // return _.find(this.issues(), function (x) { return x._id() === issueId; });
    }

    updateTaskStatus(taskOrId, stage, userOrIdOrUsername) {
        // var issue = this.getIssue(issueId),
        //     member = this.getMember(memberId);
        // if (!issue) { throw new Error('issue not found'); }
        //
        // issue.stage(toStage);
        // issue.assignee(member ? memberId : null);
    }

    updateTaskWorkingState(taskOrId, isWorking) {
        // var issue = this.getIssue(issueId);
        // if (!issue) { throw new Error('issue not found'); }
        //
        // issue.isWorking(isWorking);
        // issue.updateWorkHistory(workHistory);
    }

    updateTaskWorkHistory(taskOrId, workHistory) {
        // var issue = this.getIssue(issueId);
        // if (!issue) { throw new Error('issue not found'); }
        //
        // issue.updateWorkHistory(workHistory);
    }

    updateTaskOrder(taskOrId, beforeTaskOrId) {
        // var issue = this.getIssue(issueId);
        // if (!issue) { throw new Error('issue not found'); }
        //
        // var insertBeforeOfIssue = null;
        // if (insertBeforeOfIssueId) {
        //     insertBeforeOfIssue = this.getIssue(insertBeforeOfIssueId);
        //     if (!insertBeforeOfIssue) { throw new Error('issue not found'); }
        // }
        //
        // util.moveToBefore(this.issues, issue, insertBeforeOfIssue);
    }

    /*** user ***/

    addUser(userParams, o) {
        // this.members[(o && o.reverse) ? 'push' : 'unshift'](new User(_.extend(member.user, {
        //     issues: this.issues,
        //     wipLimit: member.wipLimit,
        //     visible: member.visible
        // })));
    }

    removeUser(userOrIdOrUsername) {
        // this.members.remove(member);
    }

    updateUser(userOrIdOrUsername, updateParams) {
        // // wip update
        // if (params && params.wipLimit && params.wipLimit !== member.wipLimit()) {
        //     member.wipLimit(params.wipLimit);
        // }
        // // visible update
        // if (params && _.isBoolean(params.visible) && params.visible !== member.visible()) {
        //     member.visible(params.visible);
        // }
    };

    getUserById(userId) {
        // return _.find(this.members(), function (x) { return x._id() === memberId; });
    };

    getUserByUsername(username) {
        // return _.find(this.members(), function (x) { return x.userName() === memberName; });
    };

    updateUserOrder(userOrIdOrUsername, beforeUserOrIdOrUsername) {
        // var member = this.getMemberByName(userName);
        // if (!member) { throw new Error('member not found'); }
        //
        // var insertBeforeOfMember = null;
        // if (insertBeforeOfUserName) {
        //     insertBeforeOfMember = this.getMemberByName(insertBeforeOfUserName);
        //     if (!insertBeforeOfMember) { throw new Error('member not found'); }
        // }
        //
        // util.moveToBefore(this.members, member, insertBeforeOfMember);
    }

    /*** label ***/

    addLabel(labelParams) {
        // this.labels.push(new Label(labelParams));
    }

    getLabelById(labelId) {
        // return _.find(this.labels(), function (x) { return x._id() === labelId; });
    };

    attachLabel(taskOrId, labelOrId) {
        // var issue = this.getIssue(issueId);
        // if (!issue) { throw new Error('issue not found'); }
        // var label = this.getLabel(labelId);
        // if (!label) { throw new Error('label not found'); }
        //
        // if (!_.includes(issue.labels(), label)) {
        //     issue.labels.push(label);
        // }
    }

    detachLabel(taskOrId, labelOrId) {
        // var issue = this.getIssue(issueId);
        // if (!issue) { throw new Error('issue not found'); }
        // var label = this.getLabel(labelId);
        // if (!label) { throw new Error('label not found'); }
        //
        // if (_.includes(issue.labels(), label)) {
        //     issue.labels.remove(label);
        // }
    }

    replaceLabelAll(newLabels, newIssues) {
        // this.labels.splice(0, this.labels.slice().length, newLabels.map(function (x) { return new model.Label(x); }));
        // // TODO: O(N^2) なので O(NlogN)に抑える
        // newIssues.forEach(function (newIssue) {
        //     var issue = this.getIssue(newIssue._id);
        //     if (!issue) { return console.error('issue not found'); }
        //     issue.labels.splice(0, issue.labels().length,
        //         newIssue.labels.map(function (labelId) { return this.getLabel(labelId); }, this));
        // }, this);
    }
}

module.exports = Project;