'use strict';
const co = require('co');
const GitHubAPI = require('./model/github_api');
const db = require('./schemas');

class AddonSocketEmit {
    // called just before raised several project emit events
    // params are {projectId, user, params, socketProject}

    static createTask({projectId, user, params, socketProject}) {
        const githubApi = new GitHubAPI(user.info.token);
        return db.sequelize.transaction(transaction => {
            return githubApi.createTask(projectId, params.task, {transaction})
                .then(githubTask => {
                    params.task.githubTask = githubTask;
                    return {projectId, user, params, socketProject};
                });
        });
    }

    static updateTaskStatus(params)        { return Promise.resolve(params); }
    static updateTaskContent(params)       { return Promise.resolve(params); }
    static attachLabel(params)             { return Promise.resolve(params); }
    static detachLabel(params)             { return Promise.resolve(params); }
}

module.exports = AddonSocketEmit;