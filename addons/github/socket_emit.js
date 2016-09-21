'use strict';
const co = require('co');
const GitHubAPI = require('./model/github_api');
const db = require('./schemas');

class AddonSocketEmit {
    // called just before raised several project emit events
    // params are {projectId, user, params, socketProject}
    static createTask({projectId, user, params, socketProject}) {
        const token = user.info.token;
        const task = params.task;
        const githubApi = new GitHubAPI(token);
        return co(function* () {
            // create github task
            const newTask = yield githubApi.createTask(projectId, {
                title: task.title,
                body: task.body,
                assigneeId: task.userId,
                stageId: task.stageId,
                labelIds: task.labels.map(x => x.id)
            });

            // relate github task
            params.task.githubTask = yield db.GitHubTask.create({
                projectId,
                taskId: task.id,
                number: newTask.githubTask.number,
                isPullRequest: newTask.githubTask.isPullRequest
            });

            return {projectId, user, params, socketProject};
        });
    }

    static archiveTask(params) {
        return Promise.resolve(params);

    }
    static updateTaskStatus(params)        { return Promise.resolve(params); }
    static updateTaskContent(params)       { return Promise.resolve(params); }
    static attachLabel(params)             { return Promise.resolve(params); }
    static detachLabel(params)             { return Promise.resolve(params); }
}

module.exports = AddonSocketEmit;