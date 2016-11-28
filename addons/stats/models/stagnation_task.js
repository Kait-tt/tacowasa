'use strict';
const _ = require('lodash');
const db = require('../schemas');
const Util = require('../modules/util');

class StagnationTask {
    static findByProjectId (projectId, {transaction} = {}) {
        return db.coTransaction({transaction}, function* () {
            const tasks = yield db.Task.findAll({where: {projectId}, transaction});
            const stagnatTasks = yield db.TaskStats.findAll({where: {taskId: {in: _.map(tasks, 'id')}, isStagnation: true}, transaction});
            return _.map(stagnatTasks, 'taskId');
        });
    }

    static calcAll (projectId, {transaction} = {}) {
        return db.coTransaction({transaction}, function* (transaction) {
            const members = yield db.Member.findAll({where: {projectId}, transaction});
            const memberStats = yield db.MemberStats.findAll({where: {memberId: {in: _.map(members, 'id')}}, transaction});
            const assignedStages = yield db.Stage.findAll({where: {projectId, assigned: true}, transaction});
            const tasks = yield db.Task.findAll({
                where: {projectId},
                include: [
                    {model: db.Cost, as: 'cost'},
                    {model: db.Work, as: 'works', separate: true}
                ],
                transaction
            });

            const stagnantTaskIds = [];
            const notStagnantTaskIds = [];
            for (let task of tasks) {
                if (!_.includes(assignedStages.map(x => x.id), task.stageId) || task.cost.value === 0 || !task.userId) {
                    notStagnantTaskIds.push(task.id);
                    continue;
                }

                const member = members.find(x => x.userId === task.userId);
                const stats = memberStats.find(x => x.memberId === member.id);
                const isStagnation = StagnationTask._isStagnationTask(task, stats);

                if (isStagnation) {
                    stagnantTaskIds.push(task.id);
                } else {
                    notStagnantTaskIds.push(task.id);
                }
            }

            // update all
            yield db.TaskStats.update({isStagnation: false}, {where: {taskId: {in: notStagnantTaskIds}}, transaction});
            for (let taskId of stagnantTaskIds) {
                yield db.TaskStats.upsert({isStagnation: true, taskId}, {field: ['taskId'], transaction});
            }

            return stagnantTaskIds;
        });
    }

    static _isStagnationTask (task, memberStats) {
        const sumTimeMinutes = Util.calcSumWorkTime(task.works) / 1000 / 60;
        const predictionTimeMinutes = task.cost.value / memberStats.throughput * 60;
        return sumTimeMinutes > predictionTimeMinutes;
    }
}

module.exports = StagnationTask;
