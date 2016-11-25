'use strict';
const _ = require('lodash');
const db = require('../../schemas');
const Util = require('../../modules/Util');

class BurnDownChart {
    static calc (projectId, {transaction} = {}) {
        return db.coTransaction({transaction}, function* (transaction) {
            const tasks = yield db.Task.findAll({
                where: {projectId},
                include: [
                    {model: db.Stage, as: 'stage'},
                    {model: db.Cost, as: 'cost'},
                    {model: db.Work, as: 'works', separate: true}
                ],
                transaction
            });

            const logs = yield db.Log.findAll({
                where: {
                    projectId,
                    action: {in: ['archiveTask', 'updateTaskStatus', 'updateTaskStatusAndOrder']}
                },
                transaction
            });
            const completedTimes = BurnDownChart._calcTaskCompletedTime(logs);
            tasks.forEach(task => {
                const completedTime = completedTimes.find(x => x.taskId === task.id);
                if (completedTime && completedTime.time) {
                    task.isCompleted = true;
                    task.completedTime = completedTime.time;
                } else if (_.includes(['done', 'archive'], task.stage.value)) {
                    task.isCompleted = true;
                    task.completedTime = task.createdAt;
                } else {
                    task.isCompleted = false;
                }
            });

            const iterations = yield db.Iteration.findAll({where: {projectId}, transaction});

            const bdc = BurnDownChart._calc(tasks, iterations);

            // TODO: update
        });
    }

    static _calc (tasks, iterations) {
        // イベントを持つユニークな時間
        const times = _.chain(tasks.works)
            .map('works')
            .concat(iterations)
            .map(x => [x.startTime, x.endTime, x.createdAt])
            .flatten()
            .map(x => Number(x))
            .sortBy()
            .uniq()
            .map(time => ({time, events: []}))
            .value();

        const _times = times.map(x => x.time);

        tasks.forEach(task => {
            _.chain(task.works)
                .map(work => [
                    {name: '0_startWork', time: Number(work.startTime), work},
                    {name: '1_endWork', time: Number(work.endTime), work}
                ])
                .concat([{name: '2_createTask', time: Number(task.createdAt), task}])
                .concat(task.isCompleted ? [] : [{name: '3_completionTask', time: Number(task.completedTime), task}])
                .forEach(event => {
                    const pos = Util.lowerBound(_times, event.time);
                    times[pos].events.push(event);
                })
                .value();
        });

        iterations.forEach(iteration => {
            [
                {name: '4_startIteration', time: Number(iteration.startTime), iteration},
                {name: '5_endIteration', time: Number(iteration.endTime), iteration}
            ].forEach(event => {
                const pos = Util.lowerBound(_times, event.time);
                times[pos].events.push(event);
            });
        });

        let taskNum = 0;
        let completedTaskNum = 0;
        let sumWorkTime = 0;
        let workingWorks = [];
        const points = times.map(({time, events}) => {
            _.chain(events)
                .sortBy('name')
                .forEach(event => {
                    switch (event.name) {
                    case '0_startWork':
                        workingWorks.push(event.work);
                        break;
                    case '1_endWork':
                        _.pull(workingWorks, event.work);
                        break;
                    case '2_createTask':
                        ++taskNum;
                        break;
                    case '3_completionTask':
                        ++completedTaskNum;
                        break;
                    }
                })
                .value();

            workingWorks.forEach(work => {
                sumWorkTime += Number(time) - Number(work.startTime);
            });

            return {taskNum, completedTaskNum, remainingTaskNum: taskNum - completedTaskNum, sumWorkTime};
        });

        return points;
    }

    static _calcTaskCompletedTime (logs) {
        return _.chain(logs)
            .map(log => log.toJSON())
            .map(log => {
                log.content = JSON.parse(log.content);
                log.taskId = log.content.task.id;
                log.status = log.content.task.status.name;
                log.time = Number(log.createdAt);
            })
            .groupBy('taskId')
            .map(({statusLogs, taskId}) => {
                let lastCompletedTime = 0;
                statusLogs.forEach(log => {
                    if (_.includes(['done', 'archive'], log.status)) {
                        if (!lastCompletedTime) {
                            lastCompletedTime = log.time;
                        }
                    } else {
                        lastCompletedTime = 0;
                    }
                });
                return {taskId, time: lastCompletedTime, isCompleted: lastCompletedTime > 0};
            })
            .value();
    }
}

module.exports = BurnDownChart;
