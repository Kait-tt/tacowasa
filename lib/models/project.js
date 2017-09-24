'use strict';
const db = require('../schemes');
const _ = require('lodash');
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

    static async findAll (options = {}) {
        const projects = await db.Project.findAll(_.defaults(options, Project.defaultFindOption));
        return projects.map(Project._serialize);
    }

    static async findOne (options = {}) {
        const project = await db.Project.findOne(_.defaults(options, Project.defaultFindOption));
        return project && Project._serialize(project);
    }

    static async findOneMedium (options = []) {
        const project = await db.Project.findOne(_.defaults(options, Project.defaultFindMediumOption));
        return project && Project._serialize(project);
    }

    static async findById (id, options = {}) {
        const project = await db.Project.findById(id, _.defaults(options, Project.defaultFindOption));
        return project && Project._serialize(project);
    }

    static async findByIncludedUsername (username, options = {include: [{model: db.User, as: 'users'}, {model: db.User, as: 'createUser'}]}) {
        const projects = await db.Project.findAll(_.defaults(options, Project.defaultFindOption));
        return projects.filter(x => _.find(x.users, {username})).map(Project._serialize);
    }

    static async create (name, username, {transaction, include} = {}) {
        return db.transaction({transaction}, async transaction => {
            // create
            const user = await User.findOrCreate(username, {transaction});
            const project = await db.Project.create({name: name, createUserId: user.id}, {transaction});

            // set options
            await Project.createDefaultAccessLevels(project.id, {transaction});
            await Project.createDefaultStages(project.id, {transaction});
            await Project.createDefaultCosts(project.id, {transaction});
            await Project.createDefaultLabels(project.id, {transaction});

            // set default options
            const defaultAccessLevel = await db.AccessLevel.findOne({where: {projectId: project.id, name: 'Developer'}, transaction});
            const defaultStage = await db.Stage.findOne({where: {projectId: project.id, name: 'issue'}, transaction});
            const defaultCost = await db.Cost.findOne({where: {projectId: project.id, name: 'undecided'}, transaction});
            await project.update({
                defaultAccessLevelId: defaultAccessLevel.id,
                defaultStageId: defaultStage.id,
                defaultCostId: defaultCost.id
            }, {transaction});

            // add owner as member
            const ownerAccessLevel = await db.AccessLevel.findOne({where: {projectId: project.id, name: 'Owner'}, transaction});
            await Member.add(project.id, username, {
                wipLimit: project.defaultWipLimit,
                accessLevelId: ownerAccessLevel.id
            }, {transaction});

            return await Project.findById(project.id, {include, transaction});
        });
    }

    static _serialize (project) {
        const res = project.toJSON ? project.toJSON() : project;
        res.tasks = res.tasks && Task.sort(res.tasks);
        res.users = res.users && Member.sort(res.users);
        res.stages = res.stages && Project._sortStages(res.stages);
        return res;
    }

    static _sortStages (stages) {
        if (!stages.length || !stages[0].name) { return stages; }
        const sortedKeys = ['memo', 'issue', 'backlog', 'ready', 'todo', 'doing', 'review', 'done', 'archive'];
        stages.forEach(stage => {
            const idx = sortedKeys.indexOf(stage.name);
            stage.sortIndex = idx;
        });

        return _.sortBy(stages, 'sortIndex');
    }

    static async archive (id, options = {}) {
        await db.Project.update({enabled: false}, _.defaults({where: {id}}, options));
        return await Project.findById(id, options);
    }

    static async createDefaultAccessLevels (projectId, options = {}) {
        return await db.AccessLevel.bulkCreate([
            {projectId, name: 'Owner', canReadReports: true, canWriteOwnTasks: true, canWriteTasks: true, canWriteLabels: true, canWriteProject: true},
            {projectId, name: 'ProjectManager', canReadReports: true, canWriteOwnTasks: true, canWriteTasks: true, canWriteLabels: true, canWriteProject: false},
            {projectId, name: 'Developer', canReadReports: false, canWriteOwnTasks: true, canWriteTasks: true, canWriteLabels: false, canWriteProject: false}
        ], options);
    }

    static async createDefaultStages (projectId, options = {}) {
        return await db.Stage.bulkCreate([
            {projectId, name: 'memo', displayName: 'Memo', assigned: false, canWork: false},
            {projectId, name: 'issue', displayName: 'Issue', assigned: false, canWork: false},
            {projectId, name: 'backlog', displayName: 'Backlog', assigned: false, canWork: false},
            {projectId, name: 'ready', displayName: 'Ready', assigned: false, canWork: false},
            {projectId, name: 'todo', displayName: 'TODO', assigned: true, canWork: false},
            {projectId, name: 'doing', displayName: 'Doing', assigned: true, canWork: true},
            {projectId, name: 'review', displayName: 'Review', assigned: true, canWork: true},
            {projectId, name: 'done', displayName: 'Done', assigned: false, canWork: false},
            {projectId, name: 'archive', displayName: 'Archive', assigned: false, canWork: false}
        ], options);
    }

    static async createDefaultCosts (projectId, options = {}) {
        return await db.Cost.bulkCreate([
            {projectId, name: 'undecided', value: 0},
            {projectId, name: 'very low', value: 1},
            {projectId, name: 'low', value: 2},
            {projectId, name: 'medium', value: 3},
            {projectId, name: 'high', value: 5},
            {projectId, name: 'very high', value: 8}
        ], options);
    }

    static async createDefaultLabels (projectId, options = {}) {
        return await db.Label.bulkCreate([
            {projectId, name: 'bug', color: 'fc2929'},
            {projectId, name: 'enhancement', color: '009800'},
            {projectId, name: 'feature', color: '0052cc'}
        ], options);
    }
}

module.exports = Project;
