'use strict';
const GitHubApi = require('../models/github_api');
const db = require('../schemas');
const Hook = require('./hook');
const {NODE_ENV} = process.env;

class GitHubAddonController {
    static async importProject (req, res) {
        if (!req.user || !req.user.token) {
            return res.status(401).json({message: 'require authorization'});
        }

        const {username, reponame} = req.body;
        if (!username || !reponame) {
            return res.status(400).json({message: 'require username and reponame.'});
        }

        const githubApi = new GitHubApi(req.user.token);

        try {
            const project = await githubApi.importProject({user: username, repo: reponame, createUsername: req.user.username});
            await db.Log.create({projectId: project.id, action: 'importProjectFromGitHub', content: JSON.stringify({project: project})});
            res.status(200).json({message: 'OK', project});
        } catch (err) {
            if (NODE_ENV !== 'test') { console.error(err); }
            res.status(500).json({message: 'error', err});
        }
    }

    static async postHook (req, res) {
        const eventName = req.get('x-Github-Event');
        const action = req.body && req.body.action;
        const projectId = req.params && req.params.projectId;

        try {
            const project = await db.Project.findOne({where: {id: projectId}, include: []});
            if (!project) {
                return res.status(404).json({message: 'project was not found'});
            }

            const hook = Hook.getHook(eventName, action);

            if (!hook) {
                return res.status(400).json({message: 'specified event or action is not supported'});
            }

            const hookResponse = await hook(project.id, req.body.issue);
            res.status(200).json(hookResponse);
        } catch (err) {
            if (NODE_ENV !== 'test') { console.error(err); }
            res.status(500).json({message: err.message});
        }
    }
}

module.exports = GitHubAddonController;
