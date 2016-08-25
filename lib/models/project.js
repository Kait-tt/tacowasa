'use strict';
const db = require('../schemes');
const _ = require('lodash');


class Project {

    static get defaultFindOption() {
        return {
            include: [
                {model: db.User, as: 'users'},
                {model: db.Stage, as: 'stages'},
                {model: db.Cost, as: 'costs'},
                {model: db.Task, as: 'tasks'},
                {model: db.Label, as: 'labels'},
                {model: db.AccessLevel, as: 'accessLevels'},
                {model: db.User, as: 'createUser'},
                {model: db.Stage, as: 'defaultStage'},
                {model: db.AccessLevel, as: 'defaultAccessLevel'},
                {model: db.Cost, as: 'defaultCost'}
            ],
            where: {
                enabled: true
            }
        };
    }

    static create(name, username) {
        let user;

        return db.User.findOrCreate({where: {username}}).then(([_user]) => user = _user)
            .then(user => db.Project.create({name: name, createUserId: user.id}))
            .then(project => {
                // setting options
                return Promise.all([
                    Project.createDefaultAccessLevels(project.id),
                    Project.createDefaultStages(project.id),
                    Project.createDefaultCosts(project.id),
                    Project.createDefaultLabels(project.id)
                ]).then(() => Promise.all([
                    db.AccessLevel.findOne({projectId: project.id, name: 'Developer'}),
                    db.Stage.findOne({projectId: project.id, name: 'issue'}),
                    db.Cost.findOne({projectId: project.id, name: 'undecided'})
                ])).then(([defaultAccessLevel, defaultStage, defaultCost]) => {
                    return project.update({
                        defaultAccessLevelId: defaultAccessLevel.id,
                        defaultStageId: defaultStage.id,
                        defaultCostId: defaultCost.id
                    });
                });
            }).then(project => {
                // add owner
                return db.AccessLevel.findOne({projectId: project.id, name: 'Owner'})
                    .then(owner => project.addUser(user, {accessLevelId: owner.id, wipLimit: project.defaultWipLimit}))
                    .then(() => project);
            }).then(project => Project.findById(project.id));
    }

    static findAll(options={}) {
        return db.Project.findAll(_.defaults(options, Project.defaultFindOption))
            .then(projects => projects.map(x => x.toJSON()));
    }

    static findOne(options={}) {
        return db.Project.findOne(_.defaults(options, Project.defaultFindOption))
            .then(project => project.toJSON());
    }

    static findById(id, options={}) {
        return db.Project.findById(id, _.defaults(options, Project.defaultFindOption))
            .then(project => project.toJSON());
    }

    static findByIncludedUsername(username, options={}) {
        return findAll(options)
            .then(projects => projects.filter(x => _.find(x.users, {username})));
    }

    static archive(id, options={}) {
        return db.Project.update({enabled: false}, _.defaults({where: {id}}, options))
            .then(() => Project.findById(id, options));
    }

    static createDefaultAccessLevels(projectId, options={}) {
        return db.AccessLevel.bulkCreate([
            {projectId, name: 'Owner', canReadReports: true, canWriteOwnTasks: true,
                canWriteTasks: true, canWriteLabels: true, canWriteProject: true},
            {projectId, name: 'ProjectManager', canReadReports: true, canWriteOwnTasks: true,
                canWriteTasks: true, canWriteLabels: true, canWriteProject: false},
            {projectId, name: 'Developer', canReadReports: false, canWriteOwnTasks: true,
                canWriteTasks: true, canWriteLabels: false, canWriteProject: false}
        ], options);
    }

    static createDefaultStages(projectId, options={}) {
        return db.Stage.bulkCreate([
            {projectId, name: 'issue',    displayName: 'Issue',   assigned: false, canWork: false},
            {projectId, name: 'backlog',  displayName: 'Backlog', assigned: false, canWork: false},
            {projectId, name: 'todo',     displayName: 'TODO',    assigned: true,  canWork: false},
            {projectId, name: 'doing',    displayName: 'Doing',   assigned: true,  canWork: true},
            {projectId, name: 'review',   displayName: 'Review',  assigned: true,  canWork: false},
            {projectId, name: 'done',     displayName: 'Done',    assigned: false, canWork: false},
            {projectId, name: 'archive',  displayName: 'Archive', assigned: false, canWork: false}
        ], options);
    }

    static createDefaultCosts(projectId, options={}) {
        return db.Cost.bulkCreate([
            {projectId, name: 'low',         value: 1},
            {projectId, name: 'medium',      value: 3},
            {projectId, name: 'high',        value: 5},
            {projectId, name: 'undecided',   value: 999}
        ], options);
    }

    static createDefaultLabels(projectId, options={}) {
        return db.Label.bulkCreate([
            {projectId, name: 'bug',         color: 'fc2929'},
            {projectId, name: 'enhancement', color: '009800'},
            {projectId, name: 'feature',     color: '0052cc'}
        ], options);
    }
}

module.exports = Project;