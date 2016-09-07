const express = require('express');
const router = express.Router();
const Project = require('../lib/models/project');
const _  = require('lodash');


router.get('/:projectId/:projectName', function (req, res, next) {
    const {projectId, projectName} = req.params;
    const username = req.user.username;

    Project.findOne({where: {id: projectId, name: projectName}})
        .then(project => res.render('kanban', {
            title: `${project.name} | Tacowasa`,
            displayTitle: project.name,
            project: project,
            stages: project.stages,
            assignedStageNamesJSON: _.chain(project.stages)
                .filter({assigned: true})
                .map('name')
                .value(),
            logined: true,
            username: username
        }))
        .catch(err => next(err));
});

module.exports = router;