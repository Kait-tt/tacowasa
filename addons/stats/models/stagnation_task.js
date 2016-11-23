'use strict';
const _ = require('lodash');
const ProjectStats = require('./project_stats');
const db = require('../schemas');
const Util = require('../modules/util');

class StagnationTask {
    static calcAll (projectId, {transaction} = {}) {
        return db.coTransaction({transaction}, function* (transaction) {
            const memberStats = yield ProjectStats.findEachMembers(projectId, {transaction});
            const workStages = yield db.Stage.findAll({where: {projectId, canWork: true}, transaction});
            const tasks = yield db.Task.findAll({
                where: {projectId},
                include: [
                    {model: db.Cost, as: 'cost'},
                    {model: db.Work, as: 'works', separate: true}
                ],
                transaction
            });
            const workingTasks = tasks
                .filter(x => _.includes(workStages.map(y => y.id), x.stageId))
                .filter(x => x.cost.value > 0);

            const stagnantTaskIds = [];
            for (let task of workingTasks) {
                const stats = memberStats.find(x => x.userId === task.userId);
                const isStagnation = yield StagnationTask._isStagnationTask(task, stats);

                if (isStagnation) {
                    stagnantTaskIds.push(task.id);
                }
            }

            return stagnantTaskIds;
        });
    }

    static _isStagnationTask (task, memberStats) {
        const sumTimeMinutes = Util.calcSumWorkTime(task.works) / 1000 / 60;
        const predictionTimeMinutes = memberStats.throughput * task.cost.value * 60;
        return sumTimeMinutes > predictionTimeMinutes;
    }
}

module.exports = StagnationTask;
