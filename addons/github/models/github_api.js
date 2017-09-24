'use strict';
const GitHub = require('github');
const config = require('config');
const _ = require('lodash');
const db = require('../schemas');
const Project = require('../../../lib/models/project');
const Member = require('../../../lib/models/member');
const Label = require('../../../lib/models/label');
const Task = require('../../../lib/models/task');
const User = require('../../../lib/models/user');

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

    async createTask (projectId, {id: taskId, title, body, stage, user: assignee, labels}, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const repository = await db.GitHubRepository.findOne({where: {projectId}, transaction});
            if (!repository) { return null; }
            const {username: user, reponame: repo} = repository;

            const taskOnGitHub = await this.api.issues.create({
                user,
                repo,
                title,
                body,
                labels,
                assignees: assignee ? [assignee.username] : []
            });

            if (['done', 'archive'].includes(stage.name)) {
                await this.api.issues.edit({
                    user, repo, state: 'closed', number: taskOnGitHub.number
                });
            }

            const serializedTask = await GitHubAPI.serializeTask(projectId, taskOnGitHub, {transaction});

            // relate github task
            return await db.GitHubTask.create({
                projectId,
                taskId,
                number: serializedTask.githubTask.number,
                isPullRequest: serializedTask.githubTask.isPullRequest
            }, {transaction});
        });
    }

    async updateTask (projectId, {id: taskId, stage, user: assignee, title, body, labels}) {
        const repository = await db.GitHubRepository.findOne({where: {projectId}});
        if (!repository) { return null; }
        const {username: user, reponame: repo} = repository;

        const githubTask = await db.GitHubTask.findOne({where: {
            projectId, taskId
        }});
        if (!githubTask) { return null; }

        const state = stage ? (['archive', 'done'].includes(stage.name) ? 'closed' : 'open') : null;

        return await this.api.issues.edit({
            user,
            repo,
            number: githubTask.number,
            title,
            body,
            state,
            assignees: assignee ? [assignee.username] : [],
            labels: labels ? labels.map(x => x.name) : null
        });
    }

    async importProject ({user, repo, createUsername}, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const repository = await this.fetchRepository({user, repo});
            const project = await Project.create(repo, createUsername, {transaction});
            const projectId = project.id;

            // add github repository relation
            await db.GitHubRepository.create({
                projectId,
                username: user,
                reponame: repo,
                sync: true
            }, {transaction});

            // add users
            for (let username of repository.users) {
                if (username !== createUsername) {
                    await Member.add(projectId, username, {}, {transaction});
                }
            }

            // add labels
            await Label.destroyAll(projectId, {transaction});
            for (let label of repository.labels) {
                await Label.create(projectId, label, {transaction});
            }

            // add tasks and github task
            for (let task of _.reverse(repository.tasks)) {
                task = await GitHubAPI.serializeTask(projectId, task, {transaction});
                const addedTask = await Task.create(projectId, task, {transaction});
                await db.GitHubTask.create({
                    projectId,
                    taskId: addedTask.id,
                    number: task.githubTask.number,
                    isPullRequest: task.githubTask.isPullRequest
                }, {transaction});
            }

            await this.createHook({projectId, user, repo});

            return await Project.findById(projectId, {transaction});
        });
    }

    async createHook ({projectId, user, repo}) {
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
    async syncAllTasksAndLabelsFromGitHub (projectId, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const repository = await db.GitHubRepository.findOne({where: {projectId}, transaction});
            if (!repository) { throw Error(`repository of ${projectId} was not found`); }
            const {username: user, reponame: repo} = repository;

            const tasksOnGitHub = await this.fetchTasks({user, repo});
            const labelsOnGitHub = await this.api.issues.getLabels({user, repo, per_page: 100});

            // remove all labels and task labels
            const oldLabels = await db.Label.findAll({where: {projectId}, transaction});
            for (let oldLabel of oldLabels) {
                await db.TaskLabel.destroy({where: {labelId: oldLabel.id}, transaction});
            }
            await db.Label.destroy({where: {projectId}, transaction});

            // add all labels
            const labels = [];
            for (let labelOnGitHub of labelsOnGitHub) {
                const label = await db.Label.create({
                    projectId,
                    name: labelOnGitHub.name,
                    color: labelOnGitHub.color
                }, {transaction});
                labels.push(label);
            }

            // attach all task labels
            for (let taskOnGitHub of tasksOnGitHub) {
                const githubTask = await db.GitHubTask.findOne({where: {number: String(taskOnGitHub.number), projectId}, transaction});
                if (!githubTask) { continue; }
                const task = await db.Task.findOne({where: {id: githubTask.taskId, projectId}, transaction});
                if (!task) { continue; }
                for (let taskLabelOnGitHub of taskOnGitHub.labels || []) {
                    const label = _.find(labels, {name: taskLabelOnGitHub.name});
                    if (!label) { continue; }
                    await db.TaskLabel.create({taskId: task.id, labelId: label.id}, {transaction});
                }
            }
        });
    }

    async fetchRepository ({user, repo}) {
        const users = await this.api.repos.getCollaborators({user, repo});
        const tasks = await this.fetchTasks({user, repo});
        const labels = await this.api.issues.getLabels({user, repo, per_page: 100});

        return {
            repository: {user, repo, url: `https://github.com/${user}/${repo}`},
            tasks,
            users: _.map(users, 'login'),
            labels
        };
    }

    async fetchTasks ({user, repo, state = 'all', perPage = 100, page = 1}) {
        const tasks = [];

        do {
            const data = await this.api.issues.getForRepo({user, repo, state, per_page: perPage, page});
            data.filter(x => !x.pull_request).forEach(x => tasks.push(x));
            page = GitHubAPI.getNext(data.meta);
        } while (page);

        return tasks;
    }

    // github issue -> tacowasa task
    static async serializeTask (projectId, task, {transaction} = {}) {
        const project = await db.Project.findOne({where: {id: projectId}, transaction});

        let stageName;
        if (task.state === 'open') {
            stageName = task.assignees.length ? 'todo' : 'issue';
        } else {
            stageName = 'archive';
        }
        const stage = await db.Stage.findOne({where: {projectId, name: stageName}, transaction});

        let user;
        if (stage.assigned && task.assignees.length) {
            const assignee = task.assignees[0];
            user = await User.findOrCreate(assignee.login, {transaction});
        } else {
            user = null;
        }

        const projectLabels = await db.Label.findAll({where: {projectId}, transaction});
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
