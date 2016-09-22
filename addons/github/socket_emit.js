'use strict';
const GitHubAPI = require('./model/github_api');

class AddonSocketEmit {
    // called just before raised several project emit events
    // params are {projectId, user, params, socketProject}

    static createTask({projectId, user, params, socketProject}) {
        if (user.isGitHub) { return {projectId, user, params, socketProject}; }

        const githubApi = new GitHubAPI(user.info.token);
        return githubApi.createTask(projectId, params.task)
            .then(githubTask => {
                params.task.githubTask = githubTask;
                return {projectId, user, params, socketProject};
            });
    }

    static archiveTask(params) {
        if (user.isGitHub) { return params; }
        return AddonSocketEmit.updateTask(params);
    }

    static updateTaskStatus(params) {
        if (user.isGitHub) { return params; }
        return AddonSocketEmit.updateTask(params);
    }

    static updateTaskContent(params) {
        if (user.isGitHub) { return params; }
        return AddonSocketEmit.updateTask(params);
    }

    static attachLabel(params) {
        if (user.isGitHub) { return params; }
        return AddonSocketEmit.updateTask(params);
    }
    static detachLabel(params) {
        if (user.isGitHub) { return params; }
        return AddonSocketEmit.updateTask(params);
    }

    static updateTask({projectId, user, params, socketProject}) {
        const githubApi = new GitHubAPI(user.info.token);
        return githubApi.updateTask(projectId, params.task)
            .then(() => ({projectId, user, params, socketProject}));
    }
}

module.exports = AddonSocketEmit;