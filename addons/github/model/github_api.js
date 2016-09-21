'use strict';
const GitHub = require('github');
const co = require('co');
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
    constructor(token=null) {
        this.api = new GitHub();
        if (token) {
            this.api.authenticate({
                type: 'oauth',
                token
            });
        }
    }

    static get taskBodySuffix() {
        return '\n\n[created by tacowasa]';
    }

    createTask(projectId, {title, body, assigneeId, stageId, labelIds}, {transaction}={}) {
        const that = this;

        return db.sequelize.transaction(transaction => {
            return co(function* () {
                const {username: user, reponame: repo} = yield db.GitHubRepository.findOne({where: {projectId}, transaction});

                const stage = yield db.Stage.findOne({where: {projectId, id: stageId}, transaction});
                const assignee = yield db.User.findOne({where: {id: assigneeId}, transaction});

                const labels = [];
                for (let labelId of labelIds) {
                    const label = yield db.Label.findOne({where: {id: labelId, projectId}, transaction});
                    labels.push(label.name);
                }

                const githubTask = yield that.api.issues.create({
                    user, repo, title, assignee, labels,
                    body: body + GitHubAPI.taskBodySuffix
                });

                if (['done', 'archive'].includes(stage.name)) {
                    yield that.api.issues.edit({
                        user, repo, state: 'closed'
                    });
                }

                const task = yield GitHubAPI.serializeTask(projectId, githubTask, {transaction});
                task.stageId = stage.id;

                return task;
            });
        });
    }

    fetchAvatar(username) {
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

    static get avatarPath() {
        return `${__dirname}/../../../public/images/avatar/`;
    }

    importProject({user, repo, createUsername}, {transaction}={}) {
        const that = this;

        return db.sequelize.transaction({transaction: transaction}, transaction => {
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
                for (let task of repository.tasks) {
                    task = yield GitHubAPI.serializeTask(projectId, task, {transaction});
                    const addedTask = yield Task.create(projectId, task, {transaction});
                    yield db.GitHubTask.create({
                        projectId,
                        taskId: addedTask.id,
                        number: task.githubTask.number,
                        isPullRequest: task.githubTask.isPullRequest
                    }, {transaction});
                }

                // create web hook
                yield that.createHook({projectId, user, repo});

                return Project.findOneIncludeAll({where: {id: projectId}, transaction});
            });
        });
    }

    createHook({projectId, user, repo}) {
        // TODO: create hook
        return Promise.resolve();
    }

    fetchRepository({user, repo}) {
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

    fetchTasks({user, repo, state='all', per_page=100, page=1}) {
        const that = this;
        const tasks = [];

        return co(function* () {
            let data;
            do {
                data = yield that.api.issues.getForRepo({user, repo, state, per_page, page});
                data.filter(x => !x.pull_request).forEach(x => tasks.push(x));
            } while (page = GitHubAPI.getNext(data.meta));
            return tasks;
        });
    }

    // github issue -> tacowasa task
    static serializeTask(projectId, task, {transaction}={}) {
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
                user = (yield db.User.findOrCreate({where: {username: task.assignee.login}, transaction}))[0];
            } else {
                user = null;
            }

            const projectLabels = yield db.Label.findAll({where: {projectId}, transaction});
            const labels = task.labels.map(({name}) => _.find(projectLabels, {name}));

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

    static getNext(meta) {
        if (!meta || !meta.link) { return null; }

        const regex = /\<.+?\&page=(\d+).*?\>; rel="next"/;
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