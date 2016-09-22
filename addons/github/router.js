'use strict';
const co = require('co');
const express = require('express');
const AddonRouter = require('../addon/router');
const GitHubApi = require('./model/github_api');
const db = require('./schemas');
const hooks = require('./hook');

class GitHubAddonRouter extends AddonRouter {
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

        router.post('/hook/:projectId', (req, res) => {
            const eventName = req.get('x-Github-Event');
            const action = req.body && req.body.action;
            const projectId = req.params && req.params.projectId;

            co(function* () {
                const project = yield db.Project.findOne({where: {id: projectId}});
                if (!project) {
                    res.status(404).json({message: 'project not found'});
                    return;
                }

                const hook = hooks[eventName] && hooks[eventName][action];

                if (!hook) {
                    res.status(400).json({message: 'specified event or action is not supported'});
                    return;
                }

                const hookResponse = yield hook(project.id, req.body.issue);

                res.status(200).json(hookResponse);
            }).catch(err => {
                console.error(err);
                res.status(500).json({message: err.message});
            });
        });
    }

    static get root() {
        return '/github'
    }
}

module.exports = GitHubAddonRouter;
