'use strict';
const db = require('../schemes');
const Project = require('../models/project');
const addon = require('../../addons');

class ApiController {
    static getProjects (req, res) {
        (async () => {
            let projects = await Project.findByIncludedUsername(req.user.username);
            ({projects} = await addon.callAddons('API', 'getProjects', {res, req, projects}));
            res.status(200).json({message: 'OK', projects});
        })().catch(err => ApiController._serverError(res, err));
    }

    static getProject (req, res, next) {
        const username = req.user.username;

        (async () => {
            let project = await Project.findOneMedium({where: {id: req.params.projectId}});
            if (!project) {
                return next();
            }
            if (!project.users.find(x => x.username === username)) {
                return res.status(403).json({message: 'you are not the project\'s member'});
            }

            ({project} = await addon.callAddons('API', 'getProject', {res, req, project}));
            await db.Log.create({projectId: project.id, action: 'getProject'});

            res.status(200).json({message: 'OK', project});
        })().catch(err => ApiController._serverError(res, err));
    }

    static deleteProject (req, res, next) {
        const username = req.user.username;

        (async () => {
            let project = await Project.findOne({where: {id: req.params.projectId}});
            if (!project) {
                return next();
            }
            if (!project.users.find(x => x.username === username)) {
                return res.status(403).json({message: 'you are not the project\'s member'});
            }

            project = await Project.archive(req.params.projectId);

            ({project} = await addon.callAddons('API', 'archiveProject', {res, req, project}));
            await db.Log.create({projectId: project.id, action: 'archiveProject'});

            res.status(200).json({message: 'OK', project});
        })().catch(err => ApiController._serverError(res, err));
    }

    static createProject (req, res) {
        if (!req.body.projectName) {
            return res.status(400).json({message: 'require projectName'});
        }

        (async () => {
            let project = await Project.create(req.body.projectName, req.user.username);

            ({project} = await addon.callAddons('API', 'createProject', {res, req, project}));
            await db.Log.create({projectId: project.id, action: 'createProject', content: JSON.stringify({project: project})});

            res.status(200).json({message: 'OK', project});
        })().catch(err => ApiController._serverError(res, err));
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
