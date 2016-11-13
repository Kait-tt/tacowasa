'use strict';
const co = require('co');
const db = require('../schemes');
const Project = require('../models/project');
const addon = require('../../addons');

class ApiController {
    static getProjects (req, res) {
        Project.findByIncludedUsername(req.user.username)
            .then(projects => addon.callAddons('API', 'getProjects', {res, req, projects}))
            .then(({projects}) => res.status(200).json({message: 'OK', projects}))
            .catch(err => ApiController._serverError(res, err));
    }

    static getProject (req, res, next) {
        const username = req.user.username;
        co(function* () {
            let project = yield Project.findOneMedium({where: {id: req.params.projectId}});
            if (!project) {
                return next();
            }
            if (!project.users.find(x => x.username === username)) {
                return res.status(403).json({message: 'you are not the project\'s member'});
            }
            const addonRes = yield addon.callAddons('API', 'getProject', {res, req, project});
            yield db.Log.create({projectId: project.id, action: 'getProject'});
            project = addonRes.project;
            res.status(200).json({message: 'OK', project});
        }).catch(err => ApiController._serverError(res, err));
    }

    static deleteProject (req, res, next) {
        const username = req.user.username;
        co(function* () {
            let project = yield Project.findOne({where: {id: req.params.projectId}});
            if (!project) {
                return next();
            }
            if (!project.users.find(x => x.username === username)) {
                return res.status(403).json({message: 'you are not the project\'s member'});
            }
            project = yield Project.archive(req.params.projectId);
            const addonRes = yield addon.callAddons('API', 'archiveProject', {res, req, project});
            yield db.Log.create({projectId: project.id, action: 'archiveProject'});
            project = addonRes.project;
            res.status(200).json({message: 'OK', project});
        }).catch(err => ApiController._serverError(res, err));
    }

    static createProject (req, res) {
        if (!req.body.projectName) {
            return res.status(400).json({message: 'require projectName'});
        }

        co(function* () {
            let project = yield Project.create(req.body.projectName, req.user.username);
            const addonRes = yield addon.callAddons('API', 'createProject', {res, req, project});
            project = addonRes.project;
            yield db.Log.create({projectId: project.id, action: 'createProject', content: JSON.stringify({project: project})});
            res.status(200).json({message: 'OK', project});
        }).catch(err => ApiController._serverError(res, err));
    }

    static notFound (req, res) {
        res.status(404).json({message: 'Not found'});
    }

    static _serverError (res, err) {
        console.error(err);
        res.status(500).json({message: 'server error.', error: err.message});
    }
}

module.exports = ApiController;
