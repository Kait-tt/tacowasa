'use strict';
const co = require('co');
const GitHubAPI = require('./model/github_api');
const db = require('./schemas');

class AddonSocketEmit {
    // called just before raised several project emit events
    // params are {projectId, user, params, socketProject}

    static createTask({projectId, user, params, socketProject}) {
        const githubApi = new GitHubAPI(user.info.token);
        return githubApi.createTask(projectId, params.task)
            .then(githubTask => {
                params.task.githubTask = githubTask;
                return {projectId, user, params, socketProject};
            });
    }

    static archiveTask({projectId, user, params, socketProject}) {
        const githubApi = new GitHubAPI(user.info.token);
        return githubApi.closeTask(projectId, params.task)
            .then(() => ({projectId, user, params, socketProject}));
    }

    static updateTaskStatus({projectId, user, params, socketProject}) {
        const githubApi = new GitHubAPI(user.info.token);
        return githubApi.updateTaskStatus(projectId, params.task)
            .then(() => ({projectId, user, params, socketProject}));
    }

    static updateTaskContent(params)       { return Promise.resolve(params); }
    static attachLabel(params)             { return Promise.resolve(params); }
    static detachLabel(params)             { return Promise.resolve(params); }
}

module.exports = AddonSocketEmit;