'use strict';
const db = require('../schemes');
const Project = require('../models/project');

class ProjectController {
    static getProject (req, res, next) {
        const {projectId, projectName} = req.params;
        const username = req.user.username;

        Project.findOne({
            where: {id: projectId, name: projectName},
            include: [{model: db.User, as: 'createUser', where: {username: req.params.username}}]
        }).then(project => {
            if (!project) { return next(); }
            res.render('kanban', {
                title: `${project.name} | Tacowasa`,
                displayTitle: project.name,
                logined: true,
                username: username
            });
        })
        .catch(err => next(err));
    }
}

module.exports = ProjectController;
