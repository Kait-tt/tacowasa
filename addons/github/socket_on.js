'use strict';
const AddonSocketOn = require('../addon/socket_on');
const GitHubAPI = require('./models/github_api');

class GitHubAddonSocketOn extends AddonSocketOn {
    static get socketEventKeys () {
        return ['syncAllFromGitHub'];
    }

    static syncAllFromGitHub (socketProject, user, req) {
        this._startSyncAllFromGitHub(socketProject, user);

        const githubApi = new GitHubAPI(user.info.token);
        return githubApi.syncAllTasksAndLabelsFromGitHub(socketProject.projectId)
            .then(() => {
                this._completedSyncAllFromGitHub(socketProject, user);
            })
            .catch(err => {
                this._failedSyncAllFromGitHub(socketProject, user, err);
            });
    }

    static _startSyncAllFromGitHub (socketProject, user) {
        socketProject.emits(user, 'startSyncAllFromGitHub', {});
        socketProject.logging(user.username, 'startSyncAllFromGitHub');
    }

    static _completedSyncAllFromGitHub (socketProject, user) {
        socketProject.emits(user, 'completedSyncAllFromGitHub', {});
        socketProject.logging(user.username, 'completedSyncAllFromGitHub');
    }

    static _failedSyncAllFromGitHub (socketProject, user, err) {
        socketProject.emits(user, 'failedSyncAllFromGitHub', {error: err.message});
        socketProject.logging(user.username, 'failedSyncAllFromGitHub', {error: err.message});
        console.error(err);
    }
}

module.exports = GitHubAddonSocketOn;
