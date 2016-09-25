const express = require('express');
const router = express.Router();
const Project = require('../lib/models/project');
// var Log = require('../lib/model/log');
// var logger = new (require('../lib/model/loggerAPI'));
// TODO: logging

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
    Project.findOneIncludeAll({where: {id: req.params.projectId}})
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
        .then(() => res.status(200).json({message: 'OK'}))
        .catch(err => serverError(res, err));
});

// Create a project
router.post('/projects', (req, res) => {
    Project.create(req.body.projectName, req.user.username)
        .then(project => addon.callAddons('API', 'createProject', {res, req, project}))
        .then(({project}) => res.status(200).json({message: 'OK', project}))
        .catch(err => serverError(res, err));
});

function serverError (res, err) {
    res.status(500).json({message: 'server error.', error: err.message});
    console.error(err);
}

module.exports = router;
