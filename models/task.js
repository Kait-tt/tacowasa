'use strict';
const db = require('../schemes');
const _ = require('lodash');
const co = require('co');

class Task {
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