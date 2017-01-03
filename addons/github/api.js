'use strict';
const co = require('co');
const db = require('./schemas');

class GitHubAddonApi {
    static getProject ({req, res, project}) {
        return co(function* () {
            // add github task to task
            const githubTasks = yield db.GitHubTask.findAll({where: {projectId: project.id}});
            const taskToGithubTask = {};
            for (let githubTask of githubTasks) {
                taskToGithubTask[githubTask.taskId] = githubTask.toJSON();
            }
            for (let task of project.tasks) {
                task.githubTask = taskToGithubTask[task.id];
            }

            // add github repository
            project.githubRepository = yield db.GitHubRepository.findOne({where: {projectId: project.id}});

            return {res, req, project};
        });
    }
}

module.exports = GitHubAddonApi;
