'use strict';
const _ = require('lodash');
const db = require('../../schemas');
const GitHubAPI = require('../../models/github_api');
const Task = require('../../../../lib/models/task');
const User = require('../../../../lib/models/user');

class GitHubAddonIssueHook {
    static get actionNames () {
        return ['opened', 'reopened', 'closed', 'edited', 'assigned', 'unassigned', 'labeled', 'unlabeled'];
    }

    static get actions () {
        return _.pick(GitHubAddonIssueHook, GitHubAddonIssueHook.actionNames);
    }

    static async opened (projectId, taskOnGitHub) {
        return db.transaction(async transaction => {
            await db.lock(projectId, transaction);

            // exists task?
            const existsGithubTask = await db.GitHubTask.findOne({where: {projectId, number: taskOnGitHub.number}, transaction});
            if (existsGithubTask) { return {message: 'task is already created'}; }

            // create task (emits is called on createTask)
            await GitHubAddonIssueHook.createTask(projectId, taskOnGitHub, {transaction});
            return {message: 'created task'};
        });
    }

    static async reopened (projectId, taskOnGitHub) {
        return db.transaction(async transaction => {
            await db.lock(projectId, transaction);

            const {task, justCreated} = await GitHubAddonIssueHook.findOrCreateTask(projectId, taskOnGitHub, {transaction, include: [{model: db.Stage, as: 'stage'}]});
            if (justCreated) { return {message: 'created task'}; }

            // no change?
            if (!['done', 'archive'].includes(task.stage.name)) {
                return {message: 'no changed'};
            }

            // open
            let stages = await db.Stage.findAll({where: {projectId}, transaction});
            const assigned = taskOnGitHub.assignees.length > 0;
            stages = _.filter(stages, {assigned});

            let stage;
            let userId;
            if (assigned) {
                stage = _.find(stages, {name: 'todo'}) || stages[0];
                const assignee = taskOnGitHub.assignees[0];
                const user = await User.findOrCreate(assignee.login, {transaction});
                userId = user.id;
            } else {
                stage = _.find(stages, {name: 'issue'}) || stages[0];
                userId = null;
            }

            await Task.updateStatus(projectId, task.id, {userId, stageId: stage.id}, {transaction});

            await GitHubAddonIssueHook.emits(projectId, 'updateTaskStatus',
                `updatedTask on github: {taskTitle: ${task.title}, stage: ${stage.name}`,
                task.id, {transaction});

            return {message: 'updated task status'};
        });
    }

    static async closed (projectId, taskOnGitHub) {
        return db.transaction(async transaction => {
            await db.lock(projectId, transaction);

            const {task, justCreated} = await GitHubAddonIssueHook.findOrCreateTask(projectId, taskOnGitHub, {transaction, include: [{model: db.Stage, as: 'stage'}]});
            if (justCreated) { return {message: 'created task'}; }

            // no change?
            if (['done', 'archive'].includes(task.stage.name)) {
                return {message: 'no changed'};
            }

            // close
            const stages = await db.Stage.findAll({where: {projectId}, transaction});
            const stage = _.find(stages, {name: 'done'}) || _.find(stages, {name: 'archive'}) || stages[0];

            await Task.updateStatus(projectId, task.id, {
                userId: stage.assigned ? task.userId : null,
                stageId: stage.id
            }, {transaction});

            await GitHubAddonIssueHook.emits(projectId, 'updateTaskStatus',
                `updatedTask on github: {taskTitle: ${task.title}, stage: ${stage.name}`,
                task.id, {transaction});

            return {message: 'updated task status'};
        });
    }

    static async edited (projectId, taskOnGitHub) {
        return db.transaction(async transaction => {
            await db.lock(projectId, transaction);

            const {task, justCreated} = await GitHubAddonIssueHook.findOrCreateTask(projectId, taskOnGitHub, {transaction});
            if (justCreated) { return {message: 'created task'}; }

            // no change?
            if (task.title === taskOnGitHub.title && task.body === taskOnGitHub.body) {
                return {message: 'no changed'};
            }

            // edit
            await db.Task.update({
                title: taskOnGitHub.title,
                body: taskOnGitHub.body
            }, {where: {id: task.id}, transaction});

            await GitHubAddonIssueHook.emits(projectId, 'updateTaskContent',
                `updatedTask on github: {taskTitle: ${task.title}}`,
                task.id, {transaction});

            return {message: 'updated task content'};
        });
    }

    static async assigned (projectId, taskOnGitHub) {
        return db.transaction(async transaction => {
            await db.lock(projectId, transaction);

            const {task, justCreated} = await GitHubAddonIssueHook.findOrCreateTask(projectId, taskOnGitHub, {transaction, include: [{model: db.User, as: 'user'}]});
            if (justCreated) { return {message: 'created task'}; }

            const assignee = taskOnGitHub.assignees[0];

            // no change?
            if (task.user && task.user.username === assignee.login) {
                return {message: 'no changed'};
            }

            // assign
            const user = await User.findOrCreate(assignee.login, {transaction});
            const stages = await db.Stage.findAll({where: {projectId}, transaction});
            const stage = _.find(stages, {name: 'todo'}) || stages[0];

            await Task.updateStatus(projectId, task.id, {userId: user.id, stageId: stage.id}, {transaction});

            await GitHubAddonIssueHook.emits(projectId, 'updateTaskStatus',
                `updatedTask on github: {taskTitle: ${task.title}, username: ${user ? user.username : '(null)'}, stage: ${stage.name}`,
                task.id, {transaction});

            return {message: 'updated task status'};
        });
    }

    static async unassigned (projectId, taskOnGitHub) {
        const isAssigned = taskOnGitHub.assignees.length;
        if (isAssigned) {
            return Promise.resolve({message: 'assigned? unassigned?'});
        }

        return db.transaction(async transaction => {
            await db.lock(projectId, transaction);

            const {task, justCreated} = await GitHubAddonIssueHook.findOrCreateTask(projectId, taskOnGitHub, {transaction, include: [{model: db.User, as: 'user'}]});
            if (justCreated) { return {message: 'created task'}; }

            // no change?
            if (!task.user) {
                return {message: 'no changed'};
            }

            // unassign
            const stages = await db.Stage.findAll({where: {projectId}, transaction});
            const stage = _.find(stages, {name: 'backlog'}) || _.find(stages, {name: 'issue'}) || stages[0];

            await Task.updateStatus(projectId, task.id, {userId: null, stageId: stage.id}, {transaction});

            await GitHubAddonIssueHook.emits(projectId, 'updateTaskStatus',
                `updatedTask on github: {taskTitle: ${task.title}, username: (null)}, stage: ${stage.name}`,
                task.id, {transaction});

            return {message: 'updated task status'};
        });
    }

    static async labeled (projectId, taskOnGitHub) {
        return db.transaction(async transaction => {
            await db.lock(projectId, transaction);

            await GitHubAddonIssueHook.addProjectLabels(projectId, taskOnGitHub.labels || [], {transaction});
            const {task, justCreated} = await GitHubAddonIssueHook.findOrCreateTask(projectId, taskOnGitHub, {transaction, include: [{model: db.Label, as: 'labels'}]});
            if (justCreated) { return {message: 'created task'}; }

            // emit is called on updateLabels
            await GitHubAddonIssueHook.updateLabels(projectId, task, taskOnGitHub, {transaction});

            return {message: 'updated task label'};
        });
    }

    static async unlabeled (projectId, taskOnGitHub) {
        return db.transaction(async transaction => {
            await db.lock(projectId, transaction);

            await GitHubAddonIssueHook.addProjectLabels(projectId, taskOnGitHub.labels || [], {transaction});
            const {task, justCreated} = await GitHubAddonIssueHook.findOrCreateTask(projectId, taskOnGitHub, {transaction, include: [{model: db.Label, as: 'labels'}]});
            if (justCreated) { return {message: 'created task'}; }

            // emit is called on updateLabels
            await GitHubAddonIssueHook.updateLabels(projectId, task, taskOnGitHub, {transaction});

            return {message: 'updated task label'};
        });
    }

    static async createTask (projectId, taskOnGitHub, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const serializedTask = await GitHubAPI.serializeTask(projectId, taskOnGitHub, {transaction});
            const task = await Task.create(projectId, serializedTask, {transaction});
            await db.GitHubTask.create({
                projectId,
                taskId: task.id,
                number: serializedTask.githubTask.number,
                isPullRequest: serializedTask.githubTask.isPullRequest
            }, {transaction});

            await GitHubAddonIssueHook.emits(projectId, 'createTask', `created new task on github: ${task.title}`, task.id, {transaction});

            return task;
        });
    }

    // return {task, githubTask, justCreated}
    static async findOrCreateTask (projectId, taskOnGitHub, {transaction, include} = {}) {
        return db.transaction({transaction}, async transaction => {
            const existsGitHubTask = await db.GitHubTask.findOne({where: {projectId, number: taskOnGitHub.number}, transaction});
            if (!existsGitHubTask) {
                const {task, githubTask} = await GitHubAddonIssueHook.createTask(projectId, taskOnGitHub, {transaction});
                return {task, githubTask, justCreated: true};
            }

            const task = await db.Task.findOne({
                where: {id: existsGitHubTask.taskId},
                include,
                transaction
            });

            task.githubTask = existsGitHubTask;

            return {task, justCreated: false};
        });
    }

    static async addProjectLabels (projectId, labels, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const projectLabels = await db.Label.findAll({where: {projectId}, transaction});

            for (let label of labels) {
                if (!_.find(projectLabels, {name: label.name})) {
                    label = await db.Label.create({projectId, name: label.name, color: label.color}, {transaction});
                    await GitHubAddonIssueHook.emits(projectId, 'addLabel', `add label on github: {label: ${label.name}}`, null, {
                        transaction,
                        moreParams: {label},
                        logContent: {label}
                    });
                }
            }
        });
    }

    static async updateLabels (projectId, task, taskOnGitHub, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const emitParams = [];

            const kanbanLabelNames = task.labels.map(x => x.name);
            const githubLabelNames = taskOnGitHub.labels.map(x => x.name);

            const attachLabelNames = _.difference(githubLabelNames, kanbanLabelNames);
            const detachLabelNames = _.difference(kanbanLabelNames, githubLabelNames);
            const projectLabels = await db.Label.findAll({where: {projectId}, transaction});
            for (let labelName of attachLabelNames) {
                let label = _.find(projectLabels, {name: labelName});
                await db.TaskLabel.create({projectId, taskId: task.id, labelId: label.id}, {transaction});
                emitParams.push([projectId, 'attachLabel', `attached label on github: {label: ${label.name}, task: ${task.name}}`, task.id, {
                    transaction,
                    moreParams: {label},
                    logContent: {label}
                }]);
            }

            for (let labelName of detachLabelNames) {
                const label = _.find(task.labels, {name: labelName});
                await db.TaskLabel.destroy({where: {taskId: task.id, labelId: label.id}, transaction});
                emitParams.push([projectId, 'detachLabel', `detached label on github: {label: ${label.name}, task: ${task.name}}`, task.id, {
                    transaction,
                    moreParams: {label},
                    logContent: {label}
                }]);
            }

            for (let params of emitParams) {
                await GitHubAddonIssueHook.emits.apply(null, params);
            }
        });
    }

    static async emits (projectId, name, notifyText, taskId, {transaction, moreParams = {}, logContent} = {}) {
        return db.transaction({transaction}, async transaction => {
            const task = await Task.findById(taskId, {transaction});
            const githubTask = await db.GitHubTask.findOne({where: {taskId}, transaction});
            if (githubTask) {
                task.githubTask = githubTask.toJSON();
            }
            const user = {isGitHub: true, username: 'github'};
            const socketProject = GitHubAddonIssueHook.socketProject(projectId);
            if (socketProject) {
                await socketProject.logging(user.username, name, logContent || {task}, {transaction});
                socketProject.emits(user, name, _.assign(moreParams, {task}));
                await socketProject.notifyText(user, notifyText, {transaction}).catch(err => console.error(err));
            }
        });
    }

    static socketProject (projectId) {
        const SocketRouter = require('../../../../routes/socket');
        const socket = SocketRouter.instance;
        return (socket && socket.projects[projectId]) || null;
    }
}

module.exports = GitHubAddonIssueHook;
