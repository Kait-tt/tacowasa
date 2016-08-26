const express = require('express');
const router = express.Router();
const _ = require('lodash');
const Project = require('../lib/models/project');
// var Log = require('../lib/model/log');
// var logger = new (require('../lib/model/loggerAPI'));
// TODO: logging


// Get Projects
router.get('/projects', (req, res) => {
    Project.findByIncludedUsername(req.user.username)
        .then(projects => res.status(200).json({message: 'OK', projects}))
        .catch(err => serverError(res, err));
});

// Get a Project
router.get('/projects/:projectId', (req, res) => {
    Project.findById(req.params.projectId)
        .then(project => {
            // TODO: update user avatar
            res.status(200).json({message: 'OK', project})
        })
        .catch(err => serverError(res, err));
});

// Delete a Project
router.delete('/projects/:projectId', (req, res) => {
    Project.archive(req.params.projectId)
        .then(() => res.status(200).json({message: 'OK'}))
        .catch(err => serverError(res. err));
});

// Import Project
router.post('/projects', (req, res) => {
    const {username, reponame} = req.body;
    if (!username || !reponame) {
        return res.status(400).json({message: 'Required userName and repoName.'});
    }

    // TODO: this is stub
    return res.status(500).json({message: 'stub'});
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
