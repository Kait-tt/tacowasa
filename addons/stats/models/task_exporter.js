'use strict';
const _ = require('lodash');
const db = require('../schemas');
const Util = require('../modules/util');

class TaskExporter {
    static exportOne (projectId, {transaction} = {}) {
        return db.coTransaction({transaction}, function* (transaction) {
            const project = yield db.Project.findOne({where: {id: projectId}, transaction});
            if (!project) { throw new Error(`${projectId} was not found`); }

            const now = new Date();
            const tasks = yield db.Task.findAll({
                where: {projectId: project.id},
                include: [
                    {model: db.Work, as: 'works', separate: true, include: [{model: db.Stage, as: 'stage'}]},
                    {model: db.Cost, as: 'cost'}
                ],
                transaction
            });

            const tasksWithTime = _.chain(tasks)
                .tap(tasks => {
                    tasks.map(task => {
                        task.works = task.works.filter(work => work.stage.name === 'doing');
                    });
                })
                .filter(task => task.works && task.works.length)
                .filter(task => task.works.length === _.filter(task.works, {userId: task.works[0].userId}).length)
                .filter(task => task.works.every(work => Util.calcWorkTime(work, now) <= TaskExporter.workTimeLimit))
                .map(task => {
                    const workTime = Util.calcSumWorkTime(task.works, now);
                    return {
                        taskId: task.id,
                        cost: task.cost.value,
                        userId: task.works[0].userId,
                        actualWorkTime: Math.floor(workTime / 1000 / 60),
                        completedAt: task.completedAt
                    };
                })
                .filter(task => task && task.completedAt && task.actualWorkTime && task.cost)
                .sortBy('completedAt')
                .map(task => _.pick(task, ['taskId', 'cost', 'userId', 'actualWorkTime']))
                .value();

            return {projectId: project.id, projectName: project.name, tasks: tasksWithTime};
        });
    }

    static exportAll (projectIds, {transaction} = {}) {
        return db.coTransaction({transaction}, function* (transaction) {
            const res = [];
            for (let projectId of projectIds) {
                res.push(yield TaskExporter.exportOne(projectId, {transaction}));
            }
            return res;
        });
    }

    static get workTimeLimit () {
        return 1000 * 60 * 24 * 10; // 10h
    }
}

module.exports = TaskExporter;
