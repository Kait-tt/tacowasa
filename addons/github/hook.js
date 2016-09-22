'use strict';
const co = require('co');
const _ = require('lodash');
const db = require('./schemas');
const GitHubAPI = require('./model/github_api');

function createTask(projectId, taskOnGitHub, {transaction}={}) {
    return db.sequelize.transaction({transaction}, transaction => {
        return co(function*() {
            const serializedTask = yield GitHubAPI.serializeTask(projectId, taskOnGitHub, {transaction});
            const task = yield db.Task.create(serializedTask, {transaction});
            task.githubTask = yield db.GitHubTask.create({
                projectId,
                taskId: task.id,
                number: serializedTask.githubTask.number,
                isPullRequest: serializedTask.githubTask.isPullRequest
            });

            emits(projectId, 'createTask', `created new task on github: ${task.title}`, {task});

            return task;
        });
    });
}

// return {task, githubTask, justCreated}
function findOrCreateTask(projectId, taskOnGitHub, {transaction, includes}={}) {
    return db.sequelize.transaction({transaction}, transaction => {
        return co(function*() {
            const existsGitHubTask = yield db.GitHubTask.findOne({where: {number: taskOnGitHub.number}, transaction});
            if (!existsGitHubTask) {
                const {task, githubTask} = yield createTask(projectId, taskOnGitHub, {transaction});
                return {task, githubTask, justCreated: true};
            }

            const task = yield db.Task.findOne({
                where: {id: existsGitHubTask.taskId},
                includes, transaction
            });

            task.githubTask = existsGitHubTask;

            return {task, justCreated: false}
        });
    });
}

function updateLabels(projectId, task, taskOnGitHub, {transaction}) {
    return db.sequelize.transaction({transaction}, transaction => {
        return co(function*() {
            const emitParams = [];

            const kanbanLabelNames = task.labels.map(x => name);
            const githubLabelNames = taskOnGitHub.labels.map(x => name);

            const attachLabelNames = _.difference(githubLabelNames, kanbanLabelNames);
            const detachLabelNames = _.difference(kanbanLabelNames, githubLabelNames);

            const projectLabels = yield db.Label.findAll({where: {projectId}, transaction});
            for (let labelName of attachLabelNames) {
                let label = _.find(projectLabels, {name: labelName});
                if (label) {
                    let githubLabel = _.find(taskOnGitHub.labels, {name: labelName});
                    label = yield db.Label.create({projectId, name: labelName, color: githubLabel.color})
                    emitParams.push(projectId, 'addLabel', `add label on github: {label: ${label.name}}`, {label});
                }
                yield db.TaskLabel.create({where: {projectId, taskId: task.id, labelId: label.id}, transaction});
                emitParams.push(projectId, 'detachLabel', `detached label on github: {label: ${label.name}, task: ${task.name}}`, {task, label});
            }

            for (let labelName of detachLabelNames) {
                const label = _.find(task.labels, {name: labelName.id});
                yield db.TaskLabel.destroy({where: {taskId: task.id, labelId: label.id}, transaction});
                emitParams.push(projectId, 'attachLabel', `attached label on github: {label: ${label.name}, task: ${task.name}}`, {task, label});
            }

            emitParams.forEach(params => emits.apply(null, params));
        });
    });
}

function emits(projectId, name, notifyText, params) {
    const SocketRouter = require('../../routes/socket');
    const user = {isGitHub: true, username: 'github'};
    const socket = SocketRouter.instance;
    const socketProject = socket && socket.projects[projectId];
    if (socketProject) {
        socketProject.emits(user, name, params);
        socketProject.notifyText(user, notifyText).catch(err => console.error(err));
    }
}

const hooks = {
    issues: {
        opened: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function* () {
                    // exists task?
                    const existsGithubTask = yield db.GitHubTask.findOne({where: {number: taskOnGitHub.number}, transaction});
                    if (existsGithubTask) { return; }

                    // create task (emits is called on createTask)
                    yield createTask(projectId, taskOnGitHub, {transaction});
                });
            });
        },

        reopened: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function*() {
                    const {task, justCreated} = findOrCreateTask(projectId, taskOnGitHub, {transaction, includes: [{model: db.Stage, as: 'stage'}]});
                    if (justCreated) { return; }

                    // no change?
                    if (!['done', 'archive'].includes(task.stage.name)) {
                        return;
                    }

                    // open
                    let stages = yield db.Stage.findAll({where: {projectId}, transaction});
                    const assigned = taskOnGitHub.assignee === null;
                    stages = _.filter(stages, {assigned});

                    let stage;
                    if (assigned) {
                        stage = _.find(stages, {name: 'todo'}) || stages[0];
                    } else {
                        stage = _.find(stages, {name: 'issue'}) || stages[0];
                    }

                    yield db.Task.update({stageId: stage.id}, {where: {id: task.id}, transaction});

                    emits(projectId, 'updateTaskStatus', `updatedTask on github: {taskTitle: ${task.title}`, {task});
                });
            });
        },

        closed: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function*() {
                    const {task, justCreated} = findOrCreateTask(projectId, taskOnGitHub, {transaction, includes: [{model: db.Stage, as: 'stage'}]});
                    if (justCreated) { return; }

                    // no change?
                    if (['done', 'archive'].includes(task.stage.name)) {
                        return;
                    }

                    // close
                    const stages = yield db.Stage.findAll({where: {projectId}, transaction});
                    const stage = _.find(stages, {name: 'done'}) || _.find(stages, {name: 'archive'}) || stages[0];

                    yield db.Task.update({stageId: stage.id, userId: null}, {where: {id: task.id}, transaction});

                    emits(projectId, 'updateTaskStatus', `updatedTask on github: {taskTitle: ${task.title}`, {task});
                });
            });
        },

        edited: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function*() {
                    const {task, justCreated} = findOrCreateTask(projectId, taskOnGitHub, {transaction});
                    if (justCreated) { return; }

                    // no change?
                    if (task.title === taskOnGitHub.title && task.body === taskOnGitHub.body) {
                        return;
                    }

                    // edit
                    yield db.Task.update({
                        title: taskOnGitHub.title,
                        body: taskOnGitHub.body
                    }, {where: {id: task.id}, transaction});

                    emits(projectId, 'updateTaskContent', `updatedTask on github: {taskTitle: ${task.title}`, {task});
                });
            });
        },

        assigned: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function*() {
                    const {task, justCreated} = findOrCreateTask(projectId, taskOnGitHub, {transaction, includes: [{model: db.User, as: 'user'}]});
                    if (justCreated) { return; }

                    // no change?
                    if (task.user && task.user.username === taskOnGitHub.assignee.login) {
                        return;
                    }

                    // assign
                    const user = (yield db.User.findOrCreate({where: {username: taskOnGitHub.assignee.login}, transaction}))[0];
                    yield db.Task.update({
                        userId: user.id
                    }, {where: {id: task.id}, transaction});

                    emits(projectId, 'updateTaskStatus', `updatedTask on github: {taskTitle: ${task.title}`, {task});
                });
            });
        },

        unassigned: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function*() {
                    const {task, justCreated} = findOrCreateTask(projectId, taskOnGitHub, {transaction, includes: [{model: db.User, as: 'user'}]});
                    if (justCreated) { return; }

                    // no change?
                    if (!task.user) {
                        return;
                    }

                    // assign
                    yield db.Task.update({
                        userId: null
                    }, {where: {id: task.id}, transaction});

                    emits(projectId, 'updateTaskStatus', `updatedTask on github: {taskTitle: ${task.title}`, {task});
                });
            });
        },

        labeled: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function*() {
                    const {task, justCreated} = findOrCreateTask(projectId, taskOnGitHub, {transaction, includes: [{model: db.Label, as: 'labels'}]});
                    if (justCreated) { return; }

                    // emit is called on updateLabels
                    updateLabels(projectId, task, taskOnGitHub);
                });
            });
        },

        unlabeled: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function*() {
                    const {task, justCreated} = findOrCreateTask(projectId, taskOnGitHub, {transaction, includes: [{model: db.Label, as: 'labels'}]});
                    if (justCreated) { return; }

                    // emit is called on updateLabels
                    updateLabels(projectId, task, taskOnGitHub);
                });
            });
        }
    }
};

module.exports = hooks;
