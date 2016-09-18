const express = require('express');
const router = express.Router();
const _ = require('lodash');
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
    Project.findOneIncludeAll({id: req.params.projectId})
        .then(project => addon.callAddons('API', 'getProject', {res, req, project}))
        .then(({project}) => {
            // TODO: update user avatar
            res.status(200).json({message: 'OK', project})
        })
        .catch(err => serverError(res, err));
});

// Archive a Project
router.delete('/projects/:projectId', (req, res) => {
    Project.archive(req.params.projectId)
        .then(project => addon.callAddons('API', 'archiveProject', {res, req, project}))
        .then(() => res.status(200).json({message: 'OK'}))
        .catch(err => serverError(res. err));
});

// Create a project
router.post('/projects', (req, res) => {
    Project.create(req.body.projectName, req.user.username)
        .then(project => addon.callAddons('API', 'createProject', {res, req, project}))
        .then(({project}) => res.status(200).json({message: 'OK', project}))
        .catch(err => serverError(res, err));
});

// Import Project
router.post('/projects/importByGitHub', (req, res) => {
    const {username, reponame} = req.body;
    if (!username || !reponame) {
        return res.status(400).json({message: 'require username and reponame.'});
    }

    // TODO: this is stub
    return res.status(500).json({message: 'no supported'});
    // TODO: implement import project
    // (new GitHub(req.user.token)).importProject(
    //     username,
    //     reponame,
    //     req.user.username,
    //     (err, project) => {
    //         if (err) { return serverError(res, err); }
    //
    //         Project.findPopulated({id: project.id}, {one: true}, function (err, doc) {
    //             if (err) { return serverError(res, err); }
    //             res.status(200).json({message: 'OK', project: doc });
    //         });
    //     });
});

function serverError(res, err) {
    res.status(500).json({message: 'server error.', error: err.message });
    console.error(err);
}

module.exports = router;
