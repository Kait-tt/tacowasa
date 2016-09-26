'use strict';
const co = require('co');
const express = require('express');
const router = express.Router();
const Project = require('../lib/models/project');
const db = require('../lib/schemes');
const addon = require('../addons');

// Get Projects
router.get('/projects', (req, res) => {
    Project.findByIncludedUsername(req.user.username)
        .then(projects => addon.callAddons('API', 'getProjects', {res, req, projects}))
        .then(({projects}) => res.status(200).json({message: 'OK', projects}))
        .catch(err => serverError(res, err));
});

// Get a Project
router.get('/projects/:projectId', (req, res) => {
    Project.findOne({where: {id: req.params.projectId}})
        .then(project => addon.callAddons('API', 'getProject', {res, req, project}))
        .then(({project}) => {
            // TODO: update user avatar
            res.status(200).json({message: 'OK', project});
        })
        .catch(err => serverError(res, err));
});

// Archive a Project
router.delete('/projects/:projectId', (req, res) => {
    Project.archive(req.params.projectId)
        .then(project => addon.callAddons('API', 'archiveProject', {res, req, project}))
        .then(({project}) => db.Log.create({projectId: project.id, action: 'archiveProject'}))
        .then(() => res.status(200).json({message: 'OK'}))
        .catch(err => serverError(res, err));
});

// Create a project
router.post('/projects', (req, res) => {
    co(function* () {
        let project = yield Project.create(req.body.projectName, req.user.username);
        const addonRes = yield addon.callAddons('API', 'createProject', {res, req, project});
        project = addonRes.project;
        yield db.Log.create({projectId: project.id, action: 'createProject', content: JSON.stringify({project: project})});
        res.status(200).json({message: 'OK', project});
    }).catch(err => serverError(res, err));
});

function serverError (res, err) {
    res.status(500).json({message: 'server error.', error: err.message});
    console.error(err);
}

module.exports = router;
