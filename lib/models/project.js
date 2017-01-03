'use strict';
const db = require('../schemes');
const _ = require('lodash');
const co = require('co');
const Member = require('./member');
const User = require('./user');
const Task = require('./task');

class Project {
    static get defaultFindOption () {
        return {
            include: [
                {model: db.User, as: 'users'},
                {model: db.Stage, as: 'stages', separate: true},
                {model: db.Cost, as: 'costs', separate: true},
                {model: db.Label, as: 'labels', separate: true},
                {model: db.AccessLevel, as: 'accessLevels', separate: true},
                {
                    model: db.Task,
                    as: 'tasks',
                    include: [
                        {model: db.Stage, as: 'stage'},
                        {model: db.User, as: 'user'},
                        {model: db.Cost, as: 'cost'},
                        {model: db.Label, as: 'labels'},
                        {
                            model: db.Work,
                            as: 'works',
                            include: [ {model: db.User, as: 'user'} ],
                            separate: true
                        }
                    ],
                    separate: true
                },
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

    static get defaultFindMediumOption () {
        return {
            include: [
                {model: db.User, as: 'users'},
                {model: db.Stage, as: 'stages', separate: true},
                {model: db.Cost, as: 'costs', separate: true},
                {model: db.Label, as: 'labels', separate: true},
                {model: db.AccessLevel, as: 'accessLevels', separate: true},
                {
                    model: db.Task,
                    as: 'tasks',
                    include: [
                        {model: db.Label, as: 'labels'},
                        {model: db.Work, as: 'works', separate: true}
                    ],
                    separate: true
                }
            ],
            where: {
                enabled: true
            }
        };
    }

    static create (name, username, {transaction, include} = {}) {
        return co(function* () {
            // create
            const user = yield User.findOrCreate(username, {transaction});
            const project = yield db.Project.create({name: name, createUserId: user.id}, {transaction});

            // set options
            yield Project.createDefaultAccessLevels(project.id, {transaction});
            yield Project.createDefaultStages(project.id, {transaction});
            yield Project.createDefaultCosts(project.id, {transaction});
            yield Project.createDefaultLabels(project.id, {transaction});

            // set default options
            const defaultAccessLevel = yield db.AccessLevel.findOne({where: {projectId: project.id, name: 'Developer'}, transaction});
            const defaultStage = yield db.Stage.findOne({where: {projectId: project.id, name: 'issue'}, transaction});
            const defaultCost = yield db.Cost.findOne({where: {projectId: project.id, name: 'undecided'}, transaction});
            yield project.update({
                defaultAccessLevelId: defaultAccessLevel.id,
                defaultStageId: defaultStage.id,
                defaultCostId: defaultCost.id
            }, {transaction});

            // add owner as member
            const ownerAccessLevel = yield db.AccessLevel.findOne({where: {projectId: project.id, name: 'Owner'}, transaction});
            yield Member.add(project.id, username, {
                wipLimit: project.defaultWipLimit,
                accessLevelId: ownerAccessLevel.id
            }, {transaction});

            return yield Project.findOne({where: {id: project.id}, include, transaction});
        });
    }

    static findAll (options = {}) {
        return db.Project.findAll(_.defaults(options, Project.defaultFindOption))
            .then(projects => projects.map(Project._serialize));
    }

    static findOne (options = {}) {
        return db.Project.findOne(_.defaults(options, Project.defaultFindOption))
            .then(project => project && Project._serialize(project));
    }

    static findOneMedium (options = []) {
        return db.Project.findOne(_.defaults(options, Project.defaultFindMediumOption))
            .then(project => project && Project._serialize(project));
    }

    static findById (id, options = {}) {
        return db.Project.findById(id, _.defaults(options, Project.defaultFindOption))
            .then(project => project && Project._serialize(project));
    }

    static findByIncludedUsername (username, options = {include: [{model: db.User, as: 'users'}, {model: db.User, as: 'createUser'}]}) {
        return db.Project.findAll(_.defaults(options, Project.defaultFindOption))
            .then(projects => projects.filter(x => _.find(x.users, {username})).map(Project._serialize));
    }

    static _serialize (project) {
        const res = project.toJSON ? project.toJSON() : project;
        res.tasks = res.tasks && Task.sort(res.tasks);
        res.users = res.users && Member.sort(res.users);
        return res;
    }

    static archive (id, options = {}) {
        return db.Project.update({enabled: false}, _.defaults({where: {id}}, options))
            .then(() => Project.findById(id, options));
    }

    static createDefaultAccessLevels (projectId, options = {}) {
        return db.AccessLevel.bulkCreate([
            {projectId, name: 'Owner', canReadReports: true, canWriteOwnTasks: true, canWriteTasks: true, canWriteLabels: true, canWriteProject: true},
            {projectId, name: 'ProjectManager', canReadReports: true, canWriteOwnTasks: true, canWriteTasks: true, canWriteLabels: true, canWriteProject: false},
            {projectId, name: 'Developer', canReadReports: false, canWriteOwnTasks: true, canWriteTasks: true, canWriteLabels: false, canWriteProject: false}
        ], options);
    }

    static createDefaultStages (projectId, options = {}) {
        return db.Stage.bulkCreate([
            {projectId, name: 'issue', displayName: 'Issue', assigned: false, canWork: false},
            {projectId, name: 'backlog', displayName: 'Backlog', assigned: false, canWork: false},
            {projectId, name: 'todo', displayName: 'TODO', assigned: true, canWork: false},
            {projectId, name: 'doing', displayName: 'Doing', assigned: true, canWork: true},
            {projectId, name: 'review', displayName: 'Review', assigned: true, canWork: true},
            {projectId, name: 'done', displayName: 'Done', assigned: false, canWork: false},
            {projectId, name: 'archive', displayName: 'Archive', assigned: false, canWork: false}
        ], options);
    }

    static createDefaultCosts (projectId, options = {}) {
        return db.Cost.bulkCreate([
            {projectId, name: 'undecided', value: 0},
            {projectId, name: 'low', value: 1},
            {projectId, name: 'medium', value: 3},
            {projectId, name: 'high', value: 5}
        ], options);
    }

    static createDefaultLabels (projectId, options = {}) {
        return db.Label.bulkCreate([
            {projectId, name: 'bug', color: 'fc2929'},
            {projectId, name: 'enhancement', color: '009800'},
            {projectId, name: 'feature', color: '0052cc'}
        ], options);
    }
}

module.exports = Project;
