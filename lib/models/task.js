'use strict';
const db = require('../schemes');
const _ = require('lodash');

class Task {
    static get defaultFindOption () {
        return {
            include: [
                {model: db.Stage, as: 'stage'},
                {model: db.User, as: 'user'},
                {model: db.Cost, as: 'cost'},
                {model: db.Label, as: 'labels'},
                {
                    model: db.Work,
                    as: 'works',
                    include: [ {model: db.User, as: 'user'}, {model: db.Stage, as: 'stage'} ],
                    separate: true
                }
            ]
        };
    }

    static async findOne (options = {}) {
        const task = await db.Task.findOne(_.defaults(options, Task.defaultFindOption));
        return task && task.toJSON();
    }

    static async findById (taskId, options = {}) {
        const task = await db.Task.findById(taskId, _.defaults(options, Task.defaultFindOption));
        return task && task.toJSON();
    }

    static async findAll (projectId, options = {}) {
        const tasks = await db.Task.findAll(_.defaults(options, Task.defaultFindOption, {where: {projectId}}));
        return tasks.map(x => x.toJSON());
    }

    static async create (projectId, {title, body, stageId, userId, costId, labelIds = []}, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            await db.lock(projectId, transaction);

            const project = await db.Project.findById(projectId, {include: [db.Task], transaction});
            stageId = stageId || project.defaultStageId;
            const firstTask = _.find(project.tasks, {prevTaskId: null});

            await Task._validateStageAndUser(projectId, stageId, userId, title, {transaction});
            // TODO: check WIP limit

            // create
            const newTask = await db.Task.create({
                projectId,
                title,
                body,
                userId,
                stageId,
                costId: costId || project.defaultCostId,
                nextTaskId: firstTask ? firstTask.id : null
            }, {transaction});

            for (let labelId of labelIds) {
                await db.TaskLabel.create({taskId: newTask.id, labelId}, {transaction});
            }

            await Task.updateCompletedAt(newTask.id, {transaction});

            // logging
            await db.TaskStatusLog.create({projectId, taskId: newTask.id, stageId, userId}, {transaction});

            // update link
            if (firstTask) {
                await db.Task.update({prevTaskId: newTask.id}, {where: {id: firstTask.id}, transaction});
            }

            return await Task.findById(newTask.id, {transaction});
        });
    }

    static async archive (projectId, taskId, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const archiveStage = await db.Stage.find({where: {projectId, name: 'archive'}, transaction});
            if (!archiveStage) {
                throw new Error(`archive stage was not found in ${projectId}`);
            }
            return await Task.updateStatus(projectId, taskId, {stageId: archiveStage.id}, {transaction});
        });
    }

    // update title, body and/or costId
    static async updateContent (projectId, taskId, {title, body, costId}, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const updateParams = {};
            _.forEach({title, body, costId}, (v, k) => {
                if (!_.isNil(v)) {
                    updateParams[k] = v;
                }
            });
            await db.Task.update(updateParams, {where: {projectId, id: taskId}, transaction});
            return await Task.findById(taskId, {transaction});
        });
    }

    // update assignee and/or stage
    static async updateStatus (projectId, taskId, {userId = null, stageId}, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const task = await db.Task.findById(taskId, {transaction});
            if (!task) {
                throw new Error(`task was not found, taskId: ${taskId}`);
            }

            await Task._validateStageAndUser(projectId, stageId, userId, task.title, {transaction});

            // cannot update status when task is working
            if (task.isWorking) {
                throw new Error(`cannot update status of a working task. ${task.title}`);
            }

            // TODO: check WIP limit

            await db.Task.update({userId, stageId}, {where: {projectId, id: taskId}, transaction});
            await Task.updateCompletedAt(taskId, {transaction});

            // logging
            await db.TaskStatusLog.create({projectId, taskId, stageId, userId}, {transaction});

            return await Task.findById(taskId, {transaction});
        });
    }

    // start or stop work
    static async updateWorkingState (projectId, taskId, isWorking, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const task = await Task.findById(taskId, {transaction});

            if (!task.stage.canWork) {
                throw new Error(`cannot change working state of task on cannot work task that is ${task.stage.name} in ${projectId}. (${taskId})`);
            }

            await db.Task.update({isWorking}, {where: {projectId, id: taskId}, transaction});

            if (isWorking) { // start
                await db.Work.create({userId: task.user.id, taskId: task.id, stageId: task.stage.id}, {transaction});
            } else { // stop
                const lastWork = _.find(task.works, {isEnded: false});
                if (!lastWork) {
                    throw new Error(`work was not found of ${taskId} in ${projectId}.`);
                }
                await db.Work.update({isEnded: true, endTime: Date.now()}, {where: {id: lastWork.id}, transaction});
            }
            return await Task.findById(taskId, {transaction});
        });
    }

    // replace all work history
    static async updateWorkHistory (projectId, taskId, works, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            // validation
            for (let work of works) {
                for (let key of ['isEnded', 'startTime', 'endTime', 'userId', 'taskId', 'stageId']) {
                    if (!work[key]) {
                        throw new Error(`works is invalid parameter. ${JSON.stringify({projectId, taskId, works: works}, null, '    ')}`);
                    }
                }
            }

            const existsWorks = await db.Work.findAll({where: {taskId}, transaction});

            // remove all
            for (let work of existsWorks) {
                await work.destroy({where: {}, transaction});
            }

            // add all
            const _works = works.map(x => _.defaults({taskId}, x));
            await db.Work.bulkCreate(_works, {transaction});
            return await Task.findById(taskId, {transaction});
        });
    }

    // update task order in project
    static async updateOrder (projectId, taskId, beforeTaskId, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            // not change
            if (taskId === beforeTaskId) {
                return {
                    task: await Task.findOne({where: {id: taskId, projectId}, transaction}),
                    beforeTask: await Task.findOne({where: {id: beforeTaskId, projectId}, transaction}),
                    updated: false
                };
            }

            await db.lock(projectId, transaction);

            const task = await Task.findOne({where: {id: taskId, projectId}, transaction});
            const beforeTask = beforeTaskId
                ? (await Task.findOne({where: {id: beforeTaskId, projectId}, transaction}))
                : null;

            if (!task) {
                throw new Error(`${taskId} was not found in ${projectId}.`);
            }

            if (beforeTaskId && !beforeTask) {
                throw new Error(`${beforeTaskId} was not found in ${projectId}.`);
            }

            // same position?
            if (beforeTask && beforeTask.prevTaskId === task.id) { return {updated: false}; }
            if (!beforeTask && !task.nextTaskId) { return {updated: false}; }

            // update old around links
            {
                const {prevTaskId, nextTaskId} = task;
                if (prevTaskId) {
                    await db.Task.update({nextTaskId}, {where: {projectId, id: prevTaskId}, transaction});
                }
                if (nextTaskId) {
                    await db.Task.update({prevTaskId}, {where: {projectId, id: nextTaskId}, transaction});
                }
            }

            // insert and update links
            const nextTaskId = beforeTask ? beforeTask.id : null;
            let prevTaskId;
            if (beforeTask) {
                prevTaskId = beforeTask.prevTaskId;
            } else {
                let _task = await Task.findOne({where: {nextTaskId: null, projectId}, transaction});
                prevTaskId = _task ? _task.id : null;
            }
            // update prev
            if (prevTaskId) {
                await db.Task.update({nextTaskId: task.id}, {where: {projectId, id: prevTaskId}, transaction});
            }
            // update next
            if (nextTaskId) {
                await db.Task.update({prevTaskId: task.id}, {where: {projectId, id: nextTaskId}, transaction});
            }
            // update target
            await db.Task.update({prevTaskId, nextTaskId}, {where: {projectId, id: task.id}, transaction});

            return {
                task: await Task.findOne({where: {id: taskId, projectId}, transaction}),
                beforeTask: beforeTaskId ? (await Task.findOne({where: {id: beforeTaskId, projectId}, transaction})) : null,
                updated: true
            };
        });
    }

    static async updateStatusAndOrder (projectId, taskId, beforeTaskId, {userId = null, stageId}, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const task = await Task.updateStatus(projectId, taskId, {userId, stageId}, {transaction});
            const res = await Task.updateOrder(projectId, taskId, beforeTaskId, {transaction});
            return {
                task: res.updated ? res.task : task,
                beforeTask: res.beforeTask,
                updatedOrder: res.updated
            };
        });
    }

    // params.task is taskId,  taskTitle or others
    static async _validateStageAndUser (projectId, stageId, userId, task, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const stage = await db.Stage.findOne({where: {projectId, id: stageId}, transaction});
            if (!stage) {
                throw new Error(`stage was not found, stage: ${stageId}, task: ${JSON.stringify(task)}`);
            }
            if (stage.assigned && !userId) {
                throw new Error(`no assignment is invalid with the stage(${stage.name}) in ${projectId}. (${JSON.stringify(task)})`);
            }
            if (!stage.assigned && userId) {
                throw new Error(`assignment is invalid with the stage(${stage.name}) in ${projectId}. (${JSON.stringify(task)})`);
            }
        });
    }

    static async updateCompletedAt (taskId, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const task = await db.Task.findOne({where: {id: taskId}, transaction});
            const stage = await db.Stage.findOne({where: {id: task.stageId}, transaction});
            if (_.includes(['done', 'archive'], stage.name)) {
                return db.Task.update({completedAt: new Date()}, {where: {id: taskId}, transaction});
            } else {
                return db.Task.update({completedAt: null}, {where: {id: taskId}, transaction});
            }
        });
    }

    static async getAllSorted (projectId, options) {
        const tasks = await Task.findAll(projectId, options);
        return Task.sort(tasks);
    }

    static sort (tasks) {
        if (!tasks.length) {
            return [];
        }

        const src = {};
        tasks.forEach(x => { src[x.id] = x; });

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

        if (tasks.length !== res.length) {
            console.error('sorting task is failed!');
            _.chain(src)
                .values()
                .compact()
                .forEach(task => res.push(task))
                .value();
        }

        return res;
    }

    static async validateTaskOrder (projectId, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const tasks = await db.Task.findAll({where: {projectId}, transaction});
            if (!tasks.length) { return {errors: []}; }

            const id2Task = {};
            tasks.forEach(task => {
                id2Task[task.id] = task;
            });

            const errors = [];

            const pickTaskIds = task => _.pick(task, ['id', 'nextTaskId', 'prevTaskId']);

            // validate x.nextTask.prevTask = x
            // validate x.prevTask.nextTask = x
            tasks.forEach(x => {
                if (x.nextTaskId) {
                    const nx = id2Task[x.nextTaskId];
                    if (!nx || nx.prevTaskId !== x.id) {
                        errors.push('x.nextTask.prevTask != x : ' + JSON.stringify(pickTaskIds(x)));
                    }
                }

                if (x.prevTaskId) {
                    const nx = id2Task[x.prevTaskId];
                    if (!nx || nx.nextTaskId !== x.id) {
                        errors.push('x.prevTask.nextTask != x : ' + JSON.stringify(pickTaskIds(x)));
                    }
                }
            });

            // there is only one task as first and last
            const firsts = tasks.filter(x => !x.prevTaskId);
            const lasts = tasks.filter(x => !x.nextTaskId);
            if (!firsts.length) {
                errors.push('first task was not found');
            }
            if (firsts.length > 1) {
                errors.push('first tasks are found over 2 : ' + firsts.map(x => x.id).join(' '));
            }
            if (!lasts.length) {
                errors.push('last task was not found');
            }
            if (lasts.length > 1) {
                errors.push('last tasks are found over 2' + lasts.map(x => x.id).join(' '));
            }

            // try to connect tasks
            const used = {};
            const connections = [];
            while (Object.keys(used).length < tasks.length) {
                const connection = [];
                let current = firsts.length ? firsts.pop() : tasks.find(x => !used[x.id]);

                if (used[current.id]) {
                    errors.push('loop connection : ' + JSON.stringify(pickTaskIds(current)));
                    break;
                }
                used[current.id] = true;
                connection.push(current.id);

                while (current.nextTaskId) {
                    current = id2Task[current.nextTaskId];
                    if (used[current.id]) {
                        errors.push('loop connection : ' + JSON.stringify(pickTaskIds(current)));
                        break;
                    }
                    used[current.id] = true;
                    connection.push(current.id);
                }

                connections.push(connection);
            }

            if (connections.length !== 1) {
                errors.push(`${connections.length} connections were found`);
            }

            return {errors, connections};
        });
    }
}

module.exports = Task;
