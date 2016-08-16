'use strict';
const db = require('../schemes');
const _ = require('lodash');


class Project {
    constructor() {

    }

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
            ]
        };
    }

    static create(name, createUser, {accessLevels, stages, costs, labels, defaultStage, defaultAccessLevel, defaultCost, defaultWipLimit}={}) {
        return db.Project.create({name: name, createUserId: createUser.id})
            .then(project => {
                // setting options
                return Promise.all([
                    accessLevels ? Promise.resolve(accessLevels) : Project.createDefaultAccessLevels(project.id),
                    stages       ? Promise.resolve(stages)       : Project.createDefaultStages(project.id),
                    costs        ? Promise.resolve(costs)        : Project.createDefaultCosts(project.id),
                    labels       ? Promise.resolve(labels)       : Project.createDefaultLabels(project.id)
                ]).then(([accessLevels, stages, costs, labels]) => Promise.all([
                    defaultAccessLevel  ? Promise.resolve(defaultAccessLevel) : db.AccessLevel.findOne({projectId: project.id, name: 'Developer'}),
                    defaultStage        ? Promise.resolve(defaultStage)       : db.Stage.findOne({projectId: project.id, name: 'issue'}),
                    defaultCost         ? Promise.resolve(defaultStage)       : db.Cost.findOne({projectId: project.id, name: 'undecided'}),
                    Promise.resolve(_.isNumber(defaultWipLimit) ? defaultWipLimit : 12)
                ])).then(([defaultAccessLevel, defaultStage, defaultCost, defaultWipLimit]) => {
                    return project.update({
                        defaultStageId: defaultStage.id,
                        defaultAccessLevelId: defaultAccessLevel.id,
                        defaultCostId: defaultCost.id,
                        defaultWipLimit
                    });
                });
            }).then(project => {
                // add owner
                return db.AccessLevel.findOne({projectId: project.id, name: 'Owner'})
                    .then(owner => project.addUser(createUser, {accessLevelId: owner.id, wipLimit: project.defaultWipLimit}))
                    .then(() => project);
            }).then(project => Project.findById(project.id));
    }

    static findAll(options={}) {
        return db.Project.findAll(_.defaults(options, Project.defaultFindOption))
            .then(project => project.toJSON());
    }

    static findOne(options={}) {
        return db.Project.findOne(_.defaults(options, Project.defaultFindOption))
            .then(project => project.toJSON());
    }

    static findById(id, options={}) {
        return db.Project.findById(id, _.defaults(options, Project.defaultFindOption))
            .then(project => project.toJSON());
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
            {projectId, name: 'issue',    displayName: 'Issue',   assigned: false},
            {projectId, name: 'backlog',  displayName: 'Backlog', assigned: false},
            {projectId, name: 'todo',     displayName: 'TODO',    assigned: true},
            {projectId, name: 'doing',    displayName: 'Doing',   assigned: true},
            {projectId, name: 'review',   displayName: 'Review',  assigned: true},
            {projectId, name: 'done',     displayName: 'Done',    assigned: false},
            {projectId, name: 'archive',  displayName: 'Archive', assigned: false}
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