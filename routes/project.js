const express = require('express');
const router = express.Router();
const Project = require('../lib/models/project');


router.get('/:projectId/:projectName', function (req, res, next) {
    const {projectId, projectName} = req.params;
    const username = req.user.username;

    Project.findOne({where: {id: projectId, name: projectName}, include: []})
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
