'use strict';
const db = require('../schemes');
const _ = require('lodash');
const co = require('co');

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
        return co(function* () {
            // create
            const [user] = yield db.User.findOrCreate({where: {username}});
            const project = yield db.Project.create({name: name, createUserId: user.id});

            // set options
            yield Project.createDefaultAccessLevels(project.id);
            yield Project.createDefaultStages(project.id);
            yield Project.createDefaultCosts(project.id);
            yield Project.createDefaultLabels(project.id);

            // set default options
            const defaultAccessLevel = yield db.AccessLevel.findOne({projectId: project.id, name: 'Developer'});
            const defaultStage = yield db.Stage.findOne({projectId: project.id, name: 'issue'});
            const defaultCost = yield db.Cost.findOne({projectId: project.id, name: 'undecided'});
            yield project.update({
                defaultAccessLevelId: defaultAccessLevel.id,
                defaultStageId: defaultStage.id,
                defaultCostId: defaultCost.id
            });

            // add owner as member
            const ownerAccessLevel = yield db.AccessLevel.findOne({projectId: project.id, name: 'Owner'});
            yield project.addUser(user, {accessLevelId: ownerAccessLevel.id, wipLimit: project.defaultWipLimit});

            return yield Project.findById(project.id);
        });
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
        return Project.findAll(options)
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