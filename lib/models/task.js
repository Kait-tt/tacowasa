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
                {model: db.Work, as: 'works', include: [
                    {model: db.User, as: 'user'}
                ]}
            ]
        };
    }

    static findOne(options={}) {
        return db.Task.findOne(_.defaults(options, Task.defaultFindOption))
            .then(task => task && task.toJSON());
    }

    static findById(taskId, options={}) {
        return db.Task.findById(taskId, _.defaults(options, Task.defaultFindOption))
            .then(task => task && task.toJSON());
    }

    static findAll(projectId, options={}) {
        return db.Task.findAll(_.defaults(options, Task.defaultFindOption, {where: {projectId}}))
            .then(tasks => tasks.map(x => x.toJSON()));
    }

    static create(projectId, {title, body, stageId, userId, costId/*, labelId=[]*/}) {
        return co(function* () {
            const project = yield db.Project.findById(projectId, {include: [db.Task]});
            stageId = stageId || project.defaultStageId;
            const firstTask = _.find(project.tasks, {prevTaskId: null});

            yield Task._validateStageAndUser(projectId, stageId, userId, title);
            // TODO: check WIP limit

            // create
            const newTask = yield db.Task.create({
                projectId, title, body, userId, stageId,
                costId: costId || project.defaultCostId,
                nextTaskId: firstTask && firstTask.id
            });

            // update link
            if (firstTask) {
                yield db.Task.update({prevTaskId: newTask.id}, {where: {id: firstTask.id}});
            }

            return yield Task.findById(newTask.id);
        });
    }

    static archive(projectId, taskId) {
        return co(function* () {
            const archiveStage = yield db.Stage.find({where: {projectId, name: 'archive'}});
            if (!archiveStage) {
                throw new Error(`archive stage is not found in ${projectId}`);
            }
            yield db.Task.update({stageId: archiveStage.id}, {where: {projectId, id: taskId}});
            return yield Task.findById(taskId);
        });
    }

    // update title, body and/or costId
    static updateContent(projectId, taskId, {title, body, costId}) {
        return co(function* () {
            const updateParams = {};
            _.forEach({title, body, costId}, (v, k) => {
                if (!_.isNil(v)) {
                    updateParams[k] = v;
                }
            });
            yield db.Task.update(updateParams, {where: {projectId, id: taskId}});
            return yield Task.findById(taskId);
        });
    }

    // update assignee and/or stage
    static updateStatus(projectId, taskId, {userId=null, stageId}) {
        return co(function* () {
            const task = yield db.Task.findById(taskId);

            yield Task._validateStageAndUser(projectId, stageId, userId, task.title);

            // cannot update status when task is working
            if (task.isWorking) {
                throw new Error(`cannot update status of a task when the task is working. ${task.title}`);
            }

            // TODO: check WIP limit

            yield db.Task.update({userId, stageId}, {where: {projectId, id: taskId}});
            return yield Task.findById(taskId);
        });
    }

    // start or stop work
    static updateWorkingState(projectId, taskId, isWorking) {
        return co(function* () {
            const task = yield Task.findById(taskId);

            if (!task.stage.canWork) {
                throw new Error(`cannot change working when stage of task is ${task.stage.name} in ${projectId}. (${taskId})`);
            }

            yield db.Task.update({isWorking}, {where: {projectId, id: taskId}});

            if (isWorking) { // start
                yield db.Work.create({userId: task.user.id, taskId: task.id});
            } else { // stop
                const lastWork = _.find(task.works, {isEnded: false});
                if (!lastWork) {
                    throw new Error(`work is not found of ${taskId} in ${projectId}.`);
                }
                yield db.Work.update({isEnded: true, endTime: Date.now()}, {where: {id: lastWork.id}});
            }
            return yield Task.findById(taskId);
        });
    }

    // replace all work history
    static updateWorkHistory(projectId, taskId, works) {
        return co(function* () {
            // validation
            for (let work of works) {
                for (let key of ['isEnded', 'startTime', 'endTime', 'userId', 'taskId']) {
                    if (!work[key]) {
                        throw new Error(`works is invalid parameter. ${JSON.stringify({projectId, taskId, works: works}, null, '    ')}`);
                    }
                }
            }

            const existsWorks = yield db.Work.findAll({where: {taskId}});

            // remove all
            for (let work of existsWorks) {
                yield work.destroy();
            }

            // add all
            const _works = works.map(x => _.defaults({taskId}, x));
            yield db.Work.bulkCreate(_works);
            return yield Task.findById(taskId);
        });
    }

    // update task order in project
    static updateOrder(projectId, taskId, beforeTaskId) {
        return co(function* () {
            if (taskId === beforeTaskId) {
                throw new Error(`taskId(${taskId}) should not equals beforeTaskId(${beforeTaskId})`);
            }

            const task = yield Task.findOne({where: {id: taskId, projectId}});
            const beforeTask = beforeTaskId && (yield Task.findOne({where: {id: beforeTaskId, projectId}}));

            if (!task) {
                throw new Error(`${taskId} was not found in ${projectId}.`);
            }

            if (beforeTaskId && !beforeTask) {
                throw new Error(`${beforeTaskId} was not found in ${projectId}.`);
            }

            // same position?
            if (beforeTask && beforeTask.prevTaskId === task.id) { return; }
            if (!beforeTask && !task.nextTaskId) { return; }

            // update old around links
            {
                const {prevTaskId, nextTaskId} = task;
                if (prevTaskId) {
                    yield db.Task.update({nextTaskId}, {where: {projectId, id: prevTaskId}});
                }
                if (nextTaskId) {
                    yield db.Task.update({prevTaskId}, {where: {projectId, id: nextTaskId}});
                }
            }

            // insert and update links
            const nextTaskId = beforeTask && beforeTask.id;
            const prevTaskId = beforeTask ? beforeTask.prevTaskId : (yield Task.findOne({where: {nextTaskId: null, projectId}})).id;
            // update prev
            if (prevTaskId) {
                yield db.Task.update({nextTaskId: task.id}, {where: {projectId, id: prevTaskId}});
            }
            // update next
            if (nextTaskId) {
                yield db.Task.update({prevTaskId: task.id}, {where: {projectId, id: nextTaskId}});
            }
            // update target
            yield db.Task.update({prevTaskId, nextTaskId}, {where: {projectId, id: task.id}});

            return {
                task: yield Task.findOne({where: {id: taskId, projectId}}),
                beforeTask: beforeTaskId && (yield Task.findOne({where: {id: beforeTaskId, projectId}}))
            };
        });
    }

    // params.task is taskId,  taskTitle or others
    static _validateStageAndUser(projectId, stageId, userId, task) {
        return co(function* () {
            const stage = yield db.Stage.findOne({where: {projectId, id: stageId}});
            if (stage.assigned && !userId) {
                throw new Error(`no assignment is invalid with the stage(${stageId}) in ${projectId}. (${task})`);
            }
            if (!stage.assigned && userId) {
                throw new Error(`assignment is invalid with the stage(${stageId} in ${projectId}. (${task})`);
            }
        });
    }

    static getAllSorted(projectId) {
        return Task.findAll(projectId)
            .then(tasks => Task.sort(tasks));
    }

    static sort(tasks) {
        if (!tasks.length) {
            return [];
        }

        const src = {};
        tasks.forEach(x => src[x.id] = x);

        const res = [];
        const first = tasks.find(x => !x.prevTaskId);
        res.push(first);
        src[first.id] = null;

        let last = first;
        while (last.nextTaskId) {
            last = src[last.nextTaskId];
            res.push(last);
            src[last.id] = null;
        }

        return res;
    }
}

module.exports = Task;