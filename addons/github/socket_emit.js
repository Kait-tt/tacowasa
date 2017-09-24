'use strict';
const GitHubAPI = require('./models/github_api');

class GitHubAddonSocketEmit {
    // called just before raised several project emit events
    // params are {projectId, user, params, socketProject}

    static createTask ({projectId, user, params, socketProject}) {
        if (user.isGitHub) { return Promise.resolve({projectId, user, params, socketProject}); }

        const githubApi = new GitHubAPI(user.info.token);
        return githubApi.createTask(projectId, params.task)
            .then(githubTask => {
                params.task.githubTask = githubTask;
                return {projectId, user, params, socketProject};
            });
    }

    static archiveTask ({projectId, user, params, socketProject}) {
        if (user.isGitHub) { return Promise.resolve({projectId, user, params, socketProject}); }
        const {task} = params;
        return GitHubAddonSocketEmit.updateTask({
            projectId,
            user,
            socketProject,
            params: {
                task: {
                    id: task.id,
                    stage: task.stage,
                    user: task.user
                }
            }
        });
    }

    static updateTaskStatus ({projectId, user, params, socketProject}) {
        if (user.isGitHub) { return Promise.resolve({projectId, user, params, socketProject}); }
        const {task} = params;
        return GitHubAddonSocketEmit.updateTask({
            projectId,
            user,
            socketProject,
            params: {
                task: {
                    id: task.id,
                    stage: task.stage,
                    user: task.user
                }
            }
        });
    }

    static updateTaskStatusAndOrder ({projectId, user, params, socketProject}) {
        if (user.isGitHub) { return Promise.resolve({projectId, user, params, socketProject}); }
        const {task} = params;
        return GitHubAddonSocketEmit.updateTask({
            projectId,
            user,
            socketProject,
            params: {
                task: {
                    id: task.id,
                    stage: task.stage,
                    user: task.user
                }
            }
        });
    }

    static updateTaskContent ({projectId, user, params, socketProject}) {
        if (user.isGitHub) { return Promise.resolve({projectId, user, params, socketProject}); }
        const {task} = params;
        return GitHubAddonSocketEmit.updateTask({
            projectId,
            user,
            socketProject,
            params: {
                task: {
                    id: task.id,
                    title: task.title,
                    body: task.body,
                    cost: task.cost
                }
            }
        });
    }

    static attachLabel ({projectId, user, params, socketProject}) {
        if (user.isGitHub) { return Promise.resolve({projectId, user, params, socketProject}); }
        const {task} = params;
        return GitHubAddonSocketEmit.updateTask({
            projectId,
            user,
            socketProject,
            params: {
                task: {
                    id: task.id,
                    labels: task.labels
                }
            }
        });
    }
    static detachLabel ({projectId, user, params, socketProject}) {
        if (user.isGitHub) { return Promise.resolve({projectId, user, params, socketProject}); }
        const {task} = params;
        return GitHubAddonSocketEmit.updateTask({
            projectId,
            user,
            socketProject,
            params: {
                task: {
                    id: task.id,
                    labels: task.labels
                }
            }
        });
    }

    static updateTask ({projectId, user, params, socketProject}) {
        const githubApi = new GitHubAPI(user.info.token);
        return githubApi.updateTask(projectId, params.task)
            .then(() => ({projectId, user, params, socketProject}));
    }
}

module.exports = GitHubAddonSocketEmit;
