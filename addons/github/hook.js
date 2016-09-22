'use strict';
const co = require('co');
const _ = require('lodash');
const db = require('./schemas');
const GitHubAPI = require('./model/github_api');
const Task = require('../../lib/models/task');

function createTask(projectId, taskOnGitHub, {transaction}={}) {
    return db.sequelize.transaction({transaction}, transaction => {
        return co(function*() {
            const serializedTask = yield GitHubAPI.serializeTask(projectId, taskOnGitHub, {transaction});
            const task = yield Task.create(projectId, serializedTask, {transaction});
            task.githubTask = yield db.GitHubTask.create({
                projectId,
                taskId: task.id,
                number: serializedTask.githubTask.number,
                isPullRequest: serializedTask.githubTask.isPullRequest
            });

            yield emits(projectId, 'createTask', `created new task on github: ${task.title}`, task.id, {transaction});

            return task;
        });
    });
}

// return {task, githubTask, justCreated}
function findOrCreateTask(projectId, taskOnGitHub, {transaction, include}={}) {
    return db.sequelize.transaction({transaction}, transaction => {
        return co(function*() {
            const existsGitHubTask = yield db.GitHubTask.findOne({where: {projectId, number: taskOnGitHub.number}, transaction});
            if (!existsGitHubTask) {
                const {task, githubTask} = yield createTask(projectId, taskOnGitHub, {transaction});
                return {task, githubTask, justCreated: true};
            }

            const task = yield db.Task.findOne({
                where: {id: existsGitHubTask.taskId},
                include, transaction
            });

            task.githubTask = existsGitHubTask;

            return {task, justCreated: false}
        });
    });
}

function updateLabels(projectId, task, taskOnGitHub, {transaction}={}) {
    return db.sequelize.transaction({transaction}, transaction => {
        return co(function*() {
            const emitParams = [];

            const kanbanLabelNames = task.labels.map(x => x.name);
            const githubLabelNames = taskOnGitHub.labels.map(x => x.name);

            const attachLabelNames = _.difference(githubLabelNames, kanbanLabelNames);
            const detachLabelNames = _.difference(kanbanLabelNames, githubLabelNames);

            const projectLabels = yield db.Label.findAll({where: {projectId}, transaction});
            for (let labelName of attachLabelNames) {
                let label = _.find(projectLabels, {name: labelName});
                if (label) {
                    let githubLabel = _.find(taskOnGitHub.labels, {name: labelName});
                    label = yield db.Label.create({projectId, name: labelName, color: githubLabel.color});
                    emitParams.push([projectId, 'addLabel', `add label on github: {label: ${label.name}}`, task.id, {transaction, moreParams: {label}}]);
                }
                yield db.TaskLabel.create({projectId, taskId: task.id, labelId: label.id}, {transaction});
                emitParams.push([projectId, 'attachLabel', `attached label on github: {label: ${label.name}, task: ${task.name}}`, task.id, {transaction, moreParams: {label}}]);
            }

            for (let labelName of detachLabelNames) {
                const label = _.find(task.labels, {name: labelName});
                yield db.TaskLabel.destroy({where: {taskId: task.id, labelId: label.id}, transaction});
                emitParams.push([projectId, 'detachLabel', `detached label on github: {label: ${label.name}, task: ${task.name}}`, task.id, {transaction, moreParams: {label}}]);
            }

            for (let params of emitParams) {
                yield emits.apply(null, params);
            }
        });
    });
}

function emits(projectId, name, notifyText, taskId, {transaction, moreParams={}}={}) {
    return Task.findById(taskId, {transaction})
        .then(task => {
            const SocketRouter = require('../../routes/socket');
            const user = {isGitHub: true, username: 'github'};
            const socket = SocketRouter.instance;
            const socketProject = socket && socket.projects[projectId];
            if (socketProject) {
                socketProject.emits(user, name, _.assign(moreParams, {task}));
                socketProject.notifyText(user, notifyText).catch(err => console.error(err));
            }
        });
}

const hooks = {
    issues: {
        opened: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function* () {
                    // exists task?
                    const existsGithubTask = yield db.GitHubTask.findOne({where: {projectId, number: taskOnGitHub.number}, transaction});
                    if (existsGithubTask) { return {message: 'task is already created'}; }

                    // create task (emits is called on createTask)
                    yield createTask(projectId, taskOnGitHub, {transaction});
                    return {message: 'created task'};
                });
            });
        },

        reopened: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function*() {
                    const {task, justCreated} = yield findOrCreateTask(projectId, taskOnGitHub, {transaction, include: [{model: db.Stage, as: 'stage'}]});
                    if (justCreated) { return {message: 'created task'}; }

                    // no change?
                    if (!['done', 'archive'].includes(task.stage.name)) {
                        return {message: 'no changed'};
                    }

                    // open
                    let stages = yield db.Stage.findAll({where: {projectId}, transaction});
                    const assigned = taskOnGitHub.assignee !== null;
                    stages = _.filter(stages, {assigned});

                    let stage;
                    let userId;
                    if (assigned) {
                        stage = _.find(stages, {name: 'todo'}) || stages[0];
                        const user = (yield db.User.findOrCreate({where: {username: taskOnGitHub.assignee}, transaction}))[0];
                        userId = user.id;
                    } else {
                        stage = _.find(stages, {name: 'issue'}) || stages[0];
                        userId = null;
                    }

                    yield db.Task.update({stageId: stage.id, userId}, {where: {id: task.id}, transaction});

                    yield emits(projectId, 'updateTaskStatus', `updatedTask on github: {taskTitle: ${task.title}}`, task.id, {transaction});

                    return {message: 'updated task status'};
                });
            });
        },

        closed: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function*() {
                    const {task, justCreated} = yield findOrCreateTask(projectId, taskOnGitHub, {transaction, include: [{model: db.Stage, as: 'stage'}]});
                    if (justCreated) { return {message: 'created task'}; }

                    // no change?
                    if (['done', 'archive'].includes(task.stage.name)) {
                        return {message: 'no changed'};
                    }

                    // close
                    const stages = yield db.Stage.findAll({where: {projectId}, transaction});
                    const stage = _.find(stages, {name: 'done'}) || _.find(stages, {name: 'archive'}) || stages[0];

                    yield db.Task.update({stageId: stage.id, userId: null}, {where: {id: task.id}, transaction});

                    yield emits(projectId, 'updateTaskStatus', `updatedTask on github: {taskTitle: ${task.title}}`, task.id, {transaction});

                    return {message: 'updated task status'};
                });
            });
        },

        edited: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function*() {
                    const {task, justCreated} = yield findOrCreateTask(projectId, taskOnGitHub, {transaction});
                    if (justCreated) { return {message: 'created task'}; }

                    // no change?
                    if (task.title === taskOnGitHub.title && task.body === taskOnGitHub.body) {
                        return {message: 'no changed'};
                    }

                    // edit
                    yield db.Task.update({
                        title: taskOnGitHub.title,
                        body: taskOnGitHub.body
                    }, {where: {id: task.id}, transaction});

                    yield emits(projectId, 'updateTaskContent', `updatedTask on github: {taskTitle: ${task.title}`, task.id, {transaction});

                    return {message: 'updated task content'};
                });
            });
        },

        assigned: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function*() {
                    const {task, justCreated} = yield findOrCreateTask(projectId, taskOnGitHub, {transaction, include: [{model: db.User, as: 'user'}]});
                    if (justCreated) { return {message: 'created task'}; }

                    // no change?
                    if (task.user && task.user.username === taskOnGitHub.assignee.login) {
                        return {message: 'no changed'};
                    }

                    // assign
                    const user = (yield db.User.findOrCreate({where: {username: taskOnGitHub.assignee.login}, transaction}))[0];
                    const stages = yield db.Stage.findAll({where: {projectId}, transaction});
                    const stage = _.find(stages, {name: 'todo'}) || stages[0];
                    yield db.Task.update({
                        userId: user.id,
                        stageId: stage.id
                    }, {where: {id: task.id}, transaction});

                    yield emits(projectId, 'updateTaskStatus', `updatedTask on github: {taskTitle: ${task.title}}`, task.id, {transaction});

                    return {message: 'updated task status'};
                });
            });
        },

        unassigned: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function*() {
                    const {task, justCreated} = yield findOrCreateTask(projectId, taskOnGitHub, {transaction, include: [{model: db.User, as: 'user'}]});
                    if (justCreated) { return {message: 'created task'}; }

                    // no change?
                    if (!task.user) {
                        return {message: 'no changed'};
                    }

                    // unassign
                    const stages = yield db.Stage.findAll({where: {projectId}, transaction});
                    const stage = _.find(stages, {name: 'backlog'}) || _.find(stages, {name: 'issue'}) || stages[0];
                    yield db.Task.update({
                        userId: null,
                        stageId: stage.id
                    }, {where: {id: task.id}, transaction});

                    yield emits(projectId, 'updateTaskStatus', `updatedTask on github: {taskTitle: ${task.title}}`, task.id, {transaction});

                    return {message: 'updated task status'};
                });
            });
        },

        labeled: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function*() {
                    const {task, justCreated} = yield findOrCreateTask(projectId, taskOnGitHub, {transaction, include: [{model: db.Label, as: 'labels'}]});
                    if (justCreated) { return {message: 'created task'}; }

                    // emit is called on updateLabels
                    yield updateLabels(projectId, task, taskOnGitHub, {transaction});

                    return {message: 'updated task label'};
                });
            });
        },

        unlabeled: (projectId, taskOnGitHub) => {
            return db.sequelize.transaction(transaction => {
                return co(function*() {
                    const {task, justCreated} = yield findOrCreateTask(projectId, taskOnGitHub, {transaction, include: [{model: db.Label, as: 'labels'}]});
                    if (justCreated) { return {message: 'created task'}; }

                    // emit is called on updateLabels
                    yield updateLabels(projectId, task, taskOnGitHub, {transaction});

                    return {message: 'updated task label'};
                });
            });
        }
    }
};

module.exports = hooks;
