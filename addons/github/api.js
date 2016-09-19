'use strict';
const db = require('./schemas');
const co = require('co');

class GitHubAddonApi {
    static getProject({res, req, project}) {
        return co(function* () {
            const githubTasks = yield db.GitHubTask.findAll({where: {projectId: project.id}});
            const taskToGithubTask = {};
            for (let githubTask of githubTasks) {
                taskToGithubTask[githubTask.taskId] = githubTask.toJSON();
            }

            for (let task of project.tasks) {
                task.githubTask = taskToGithubTask[task.id];
            }

            return {res, req, project};
        });
    }
}

module.exports = GitHubAddonApi;
