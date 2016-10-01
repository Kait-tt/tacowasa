'use strict';
const co = require('co');
const GitHubApi = require('../models/github_api');
const db = require('../schemas');
const Hook = require('./hook');

class GitHubAddonController {
    static importProject (req, res) {
        if (!req.user || !req.user.token) {
            return res.status(401).json({message: 'require authorization'});
        }

        const {username, reponame} = req.body;
        if (!username || !reponame) {
            return res.status(400).json({message: 'require username and reponame.'});
        }

        const githubApi = new GitHubApi(req.user.token);
        githubApi.importProject({user: username, repo: reponame, createUsername: req.user.username})
            .then(project => db.Log.create({projectId: project.id, action: 'importProjectFromGitHub', content: JSON.stringify({project: project})}).then(() => project))
            .then(project => {
                res.status(200).json({message: 'OK', project});
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({message: 'error', err});
            });
    }

    static postHook (req, res) {
        const eventName = req.get('x-Github-Event');
        const action = req.body && req.body.action;
        const projectId = req.params && req.params.projectId;

        co(function* () {
            const project = yield db.Project.findOne({where: {id: projectId}});
            if (!project) {
                res.status(404).json({message: 'project was not found'});
                return;
            }

            const hook = Hook.getHook(eventName, action);

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
    }
}

module.exports = GitHubAddonController;
