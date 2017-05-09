'use strict';
const db = require('./schemas');

class GitHubAddonApi {
    static async getProject ({req, res, project}) {
        // add github task to task
        const githubTasks = await db.GitHubTask.findAll({where: {projectId: project.id}});
        const taskToGithubTask = {};
        for (let githubTask of githubTasks) {
            taskToGithubTask[githubTask.taskId] = githubTask.toJSON();
        }
        for (let task of project.tasks) {
            task.githubTask = taskToGithubTask[task.id];
        }

        // add github repository
        project.githubRepository = await db.GitHubRepository.findOne({where: {projectId: project.id}});

        return {res, req, project};
    }
}

module.exports = GitHubAddonApi;
