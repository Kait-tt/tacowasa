'use strict';
const express = require('express');
const router = express.Router();
const Project = require('../lib/models/project');
const db = require('../lib/schemes');


router.get('/:username/projects/:projectId/:projectName', function (req, res, next) {
    const {projectId, projectName} = req.params;
    const username = req.user.username;

    Project.findOne({where: {id: projectId, name: projectName}, include: [{model: db.User, as: 'createUser', where: {username: req.params.username}}]})
        .then(project => {
            if (!project) { return next(); }
            res.render('kanban', {
                title: `${project.name} | Tacowasa`,
                displayTitle: project.name,
                logined: true,
                username: username
            });
        })
        .catch(err => next(err));
});

module.exports = router;
