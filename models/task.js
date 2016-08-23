'use strict';
const db = require('../schemes');
const _ = require('lodash');
const co = require('co');

class Task {
    static get defaultFindOption() {
        return {
            include: [
                {model: db.Stage, as: 'stage'},
                {model: db.User, as: 'user'},
                {model: db.Cost, as: 'cost'},
                {model: db.Label, as: 'labels'},
                {model: db.Work, as: 'works'}
            ]
        };
    }

    static findById(projectId, taskId, options={}) {
        return db.Task.findOne(_.defaults(options, Task.defaultFindOption, {where: {projectId, id: taskId}}))
            .then(task => task.toJSON());
    }

    static findAll(projectId, options={}) {
        return db.Task.findAll(_.defaults(options, Task.defaultFindOption, {where: {projectId}}))
            .then(tasks => tasks.map(x => x.toJSON()));
    }

    static add(projectId, {title, body, stageId, userId, costId/*, labelId=[]*/}) {
        return co(function* () {
            const project = yield db.Project.findById(projectId);
            stageId = stageId || project.defaultStageId;

            yield Task._validateStageAndUser(projectId, stageId, userId, title);
            // TODO: check WIP limit

            return yield db.Task.create({
                projectId, title, body, userId, stageId,
                costId: costId || project.defaultCostId
            });
        });
    }

    static archive(projectId, taskId) {
        return co(function* () {
            const archiveStage = yield db.Stage.find({where: {projectId, name: 'archive'}});
            if (!archiveStage) {
                throw new Error(`archive stage is not found in ${projectId}`);
            }
            yield db.Task.update({stageId: archiveStage.id}, {where: {projectId, id: taskId}});
        });
    }

    // update assignee and/or stage
    static updateStatus(projectId, taskId, {userId=null, stageId=null}) {

    }

    // update title, body and/or cost
    static updateContent(projectId, taskId, {title, body, cost}) {

    }

    // start or stop work
    static updateWorkingState(projectId, taskId, workingState) {

    }

    // update all work history
    static updateWorkHistory(projectId, taskId, workHistory) {

    }

    // update task order in project
    static updateOrder(projectId, taskId, beforeTaskId) {

    }

    static _validateStageAndUser(projectId, stageId, userId, title=null) {
        return co(function* () {
            const stage = yield db.Stage.findOne({where: {projectId, id: stageId}});
            if (stage.assigned && !userId) {
                throw new Error(`no assignment is invalid with the stage(${stageId}) in ${projectId}. (${title})`);
            }
            if (!stage.assigned && userId) {
                throw new Error(`assignment is invalid with the stage(${stageId} in ${projectId}. (${title})`);
            }
        });
    }
}

module.exports = Task;