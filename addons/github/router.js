'use strict';
const express = require('express');
const AddonRouter = require('../addon/router');
const GitHubApi = require('./model/github_api');

class GitHubRouter extends AddonRouter {
    static initRouter(router) {
        router.post('/api/projects', (req, res) => {
            const {username, reponame} = req.body;
            if (!username || !reponame) {
                return res.status(400).json({message: 'require username and reponame.'});
            }
            if (!req.user || !req.user.token) {
                return res.status(501).json({message: 'require login and token'});
            }

            const githubApi = new GitHubApi(req.user.token);
            githubApi.importProject({user: username, repo: reponame, createUsername: req.user.username})
                .then(project => {
                    res.status(200).json({message: 'OK', project});
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).json({message: 'error', err});
                });
        });
    }

    static get root() {
        return '/github'
    }
}

module.exports = GitHubRouter;
