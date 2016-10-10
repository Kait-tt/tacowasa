'use strict';
const GitHub = require('github');
const co = require('co');
const config = require('config');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const _ = require('lodash');
const request = require('request-promise');
const db = require('../schemas');
const Project = require('../../../lib/models/project');
const Member = require('../../../lib/models/member');
const Label = require('../../../lib/models/label');
const Task = require('../../../lib/models/task');

class GitHubAPI {
    constructor (token = null) {
        this.api = new GitHub();
        if (token) {
            this.api.authenticate({
                type: 'oauth',
                token
            });
        }
    }

    createTask (projectId, {id: taskId, title, body, stage, user: assignee, labels}, {transaction} = {}) {
        const that = this;

        return db.sequelize.transaction({transaction}, transaction => {
            return co(function* () {
                const repository = yield db.GitHubRepository.findOne({where: {projectId}, transaction});
                if (!repository) { return null; }
                const {username: user, reponame: repo} = repository;

                const taskOnGitHub = yield that.api.issues.create({
                    user,
                    repo,
                    title,
                    body,
                    labels,
                    assignee: assignee ? assignee.username : null
                });

                if (['done', 'archive'].includes(stage.name)) {
                    yield that.api.issues.edit({
                        user, repo, state: 'closed', number: taskOnGitHub.number
                    });
                }

                const serializedTask = yield GitHubAPI.serializeTask(projectId, taskOnGitHub, {transaction});

                // relate github task
                return yield db.GitHubTask.create({
                    projectId,
                    taskId,
                    number: serializedTask.githubTask.number,
                    isPullRequest: serializedTask.githubTask.isPullRequest
                }, {transaction});
            });
        });
    }

    updateTask (projectId, {id: taskId, stage, user: assignee, title, body, labels}) {
        const that = this;
        return co(function* () {
            const repository = yield db.GitHubRepository.findOne({where: {projectId}});
            if (!repository) { return null; }
            const {username: user, reponame: repo} = repository;

            const githubTask = yield db.GitHubTask.findOne({where: {
                projectId, taskId
            }});
            if (!githubTask) { return null; }

            return yield that.api.issues.edit({
                user,
                repo,
                number: githubTask.number,
                title,
                body,
                state: ['archive', 'done'].includes(stage.name) ? 'closed' : 'open',
                assignee: assignee ? assignee.username : null,
                labels: labels.map(x => x.name)
            });
        });
    }

    fetchAvatar (username) {
        const that = this;
        return co(function*() {
            const {avatar_url} = yield that.api.users.getForUser({user: username});

            const res = yield request.get({url: avatar_url, encoding: null, resolveWithFullResponse: true});

            const contentType = res.headers['content-type'];
            if (!contentType) { throw new Error('content-type header is not found'); }

            const slashPos = contentType.indexOf('/');
            if (!slashPos) { throw new Error(`invalid content-type header: ${contentType}`); }
            const exp = contentType.substr(slashPos + 1);

            const path = GitHubAPI.avatarPath + username + '.' + exp;
            yield fs.writeFileAsync(path, res.body);

            return path;
        });
    }

    static get avatarPath () {
        return `${__dirname}/../../../public/images/avatar/`;
    }

    importProject ({user, repo, createUsername}, {transaction} = {}) {
        const that = this;

        return db.sequelize.transaction({transaction}, transaction => {
            return co(function* () {
                const repository = yield that.fetchRepository({user, repo});
                const project = yield Project.create(repo, createUsername, {transaction});
                const projectId = project.id;

                // fetch avatars (async)
                for (let username of repository.users) {
                    that.fetchAvatar(username);
                }

                // add github repository relation
                yield db.GitHubRepository.create({
                    projectId,
                    username: user,
                    reponame: repo,
                    sync: true
                }, {transaction});

                // add users
                for (let username of repository.users) {
                    if (username !== createUsername) {
                        yield Member.add(projectId, username, {}, {transaction});
                    }
                }

                // add labels
                yield Label.destroyAll(projectId, {transaction});
                for (let label of repository.labels) {
                    yield Label.create(projectId, label, {transaction});
                }

                // add tasks and github task
                for (let task of _.reverse(repository.tasks)) {
                    task = yield GitHubAPI.serializeTask(projectId, task, {transaction});
                    const addedTask = yield Task.create(projectId, task, {transaction});
                    yield db.GitHubTask.create({
                        projectId,
                        taskId: addedTask.id,
                        number: task.githubTask.number,
                        isPullRequest: task.githubTask.isPullRequest
                    }, {transaction});
                }

                yield that.createHook({projectId, user, repo});

                return Project.findById(projectId, {transaction});
            });
        });
    }

    createHook ({projectId, user, repo}) {
        return this.api.repos.createHook({
            repo,
            user,
            name: 'web',
            config: {
                url: config.get('github.hookURL').replace(':id', projectId),
                content_type: 'json'
            },
            events: ['issues', 'member'],
            active: true
        });
    }

    // github を元に project のすべての labels, tasks を同期
    // 同期するのは下記の情報のみ
    //   task: {title, body, labels}
    //   label: {name, color}
    // 存在しないタスクについては考慮しない
    syncAllTasksAndLabelsFromGitHub (projectId, {transaction} = {}) {
        const that = this;
        return db.sequelize.transaction({transaction}, transaction => {
            return co(function*() {
                const repository = yield db.GitHubRepository.findOne({where: {projectId}, transaction});
                if (!repository) { throw Error(`repository of ${projectId} was not found`); }
                const {username: user, reponame: repo} = repository;

                const tasksOnGitHub = yield that.fetchTasks({user, repo});
                const labelsOnGitHub = yield that.api.issues.getLabels({user, repo, per_page: 100});

                // remove all labels and task labels
                const oldLabels = yield db.Label.findAll({where: {projectId}, transaction});
                for (let oldLabel of oldLabels) {
                    yield db.TaskLabel.destroy({where: {labelId: oldLabel.id}, transaction});
                }
                yield db.Label.destroy({where: {projectId}, transaction});

                // add all labels
                const labels = [];
                for (let labelOnGitHub of labelsOnGitHub) {
                    const label = yield db.Label.create({
                        projectId,
                        name: labelOnGitHub.name,
                        color: labelOnGitHub.color
                    }, {transaction});
                    labels.push(label);
                }

                // attach all task labels
                for (let taskOnGitHub of tasksOnGitHub) {
                    const githubTask = yield db.GitHubTask.findOne({where: {number: String(taskOnGitHub.number)}, transaction});
                    if (!githubTask) { continue; }
                    const task = yield db.Task.findOne({where: {id: githubTask.taskId}, transaction});
                    if (!task) { continue; }
                    for (let taskLabelOnGitHub of taskOnGitHub.labels || []) {
                        const label = _.find(labels, {name: taskLabelOnGitHub.name});
                        if (!label) { continue; }
                        yield db.TaskLabel.create({taskId: task.id, labelId: label.id}, {transaction});
                    }
                }
            });
        });
    }

    fetchRepository ({user, repo}) {
        const that = this;

        return co(function* () {
            const users = yield that.api.repos.getCollaborators({user, repo});
            const tasks = yield that.fetchTasks({user, repo});
            const labels = yield that.api.issues.getLabels({user, repo, per_page: 100});

            return {
                repository: {user, repo, url: `https://github.com/${user}/${repo}`},
                tasks,
                users: _.map(users, 'login'),
                labels
            };
        });
    }

    fetchTasks ({user, repo, state = 'all', perPage = 100, page = 1}) {
        const that = this;
        const tasks = [];

        return co(function* () {
            let data;
            do {
                data = yield that.api.issues.getForRepo({user, repo, state, per_page: perPage, page});
                data.filter(x => !x.pull_request).forEach(x => tasks.push(x));
                page = GitHubAPI.getNext(data.meta);
            } while (page);
            return tasks;
        });
    }

    // github issue -> tacowasa task
    static serializeTask (projectId, task, {transaction} = {}) {
        return co(function* () {
            const project = yield db.Project.findOne({where: {id: projectId}, transaction});

            let stageName;
            if (task.state === 'open') {
                stageName = task.assignee ? 'todo' : 'issue';
            } else {
                stageName = 'archive';
            }
            const stage = yield db.Stage.findOne({where: {projectId, name: stageName}, transaction});

            let user;
            if (stage.assigned && task.assignee) {
                const assignee = task.assignee || task.assignees[0];
                user = (yield db.User.findOrCreate({where: {username: assignee.login}, transaction}))[0];
            } else {
                user = null;
            }

            const projectLabels = yield db.Label.findAll({where: {projectId}, transaction});
            const labels = _.compact(task.labels.map(({name}) => _.find(projectLabels, {name})));

            return {
                title: task.title || '',
                body: task.body || '',
                projectId,
                stageId: stage.id,
                userId: user ? user.id : null,
                costId: project.defaultCostId,
                labelIds: _.map(labels, 'id'),
                githubTask: {
                    number: task.number,
                    isPullRequest: task.pull_request
                }
            };
        });
    }

    static getNext (meta) {
        if (!meta || !meta.link) { return null; }

        const regex = /<.+?&page=(\d+).*?>; rel="next"/;
        const lines = meta.link.split(',');

        for (let i = 0; i < lines.length; i++) {
            let next = regex.exec(lines[i]);
            if (next) {
                return Number(next[1]);
            }
        }

        return null;
    }
}

module.exports = GitHubAPI;
