'use strict';
const _ = require('lodash');
const db = require('../schemas');
const Util = require('../modules/util');

class BurnDownChart {
    static findByProjectId (projectId, {transaction} = {}) {
        return db.BurnDownChart.findAll({where: {projectId}, transaction});
    }

    static calc (projectId, {transaction} = {}) {
        return db.coTransaction({transaction}, function* (transaction) {
            let tasks = yield db.Task.findAll({
                where: {projectId},
                include: [
                    {model: db.Stage, as: 'stage'},
                    {model: db.Cost, as: 'cost'},
                    {model: db.Work, as: 'works', separate: true}
                ],
                transaction
            });
            tasks = tasks.map(x => x.toJSON());

            const iterations = yield db.Iteration.findAll({where: {projectId}, transaction});

            const bdc = BurnDownChart._calc(tasks, iterations);

            yield db.BurnDownChart.destroy({where: {projectId}, transaction});
            yield db.BurnDownChart.bulkCreate(bdc.map(x => _.assign(x, {projectId})), {transaction});

            return bdc;
        });
    }

    static _calc (tasks, iterations) {
        // イベントを持つユニークな時間
        const times = _.chain(tasks)
            .map('works')
            .flatten()
            .map(x => [x.startTime, x.endTime])
            .flatten()
            .concat(_.map(tasks, 'createdAt'))
            .concat(_.map(tasks, 'completedAt'))
            .concat(_.map(iterations, 'startTime'))
            .concat(_.map(iterations, 'endTime'))
            .push(Number(Date.now()))
            .compact()
            .map(x => Number(x))
            .sortBy()
            .uniq()
            .map(time => ({time, events: []}))
            .value();

        const _times = times.map(x => x.time);

        tasks.forEach(task => {
            _.chain(task.works)
                .map(work => [
                    {name: '0_startWork', time: Number(work.startTime), workId: work.id},
                    {name: '1_endWork', time: Number(work.endTime), workId: work.id}
                ])
                .flatten()
                .concat([{name: '2_createTask', time: Number(task.createdAt), taskId: task.id, cost: task.cost.value}])
                .concat(task.completedAt ? [{name: '3_completionTask', time: Number(task.completedAt), taskId: task.id, cost: task.cost.value}] : [])
                .forEach(event => {
                    const pos = Util.lowerBound(_times, event.time);
                    times[pos].events.push(event);
                })
                .value();
        });

        iterations.forEach(iteration => {
            [
                {name: '4_startIteration', time: Number(iteration.startTime), iterationId: iteration.id},
                {name: '5_endIteration', time: Number(iteration.endTime), iterationId: iteration.id}
            ].forEach(event => {
                const pos = Util.lowerBound(_times, event.time);
                times[pos].events.push(event);
            });
        });

        let taskNum = 0;
        let completedTaskNum = 0;
        let totalWorkTime = 0;
        let workingWorkIds = [];
        let beforeTime = times.length ? times[0].time : 0;
        const points = times.map(({time, events}) => {
            totalWorkTime += (Number(time) - Number(beforeTime)) * workingWorkIds.length;

            _.chain(events)
                .sortBy('name')
                .forEach(event => {
                    switch (event.name) {
                    case '0_startWork':
                        workingWorkIds.push(event.workId);
                        break;
                    case '1_endWork':
                        _.pull(workingWorkIds, event.workId);
                        break;
                    case '2_createTask':
                        taskNum += event.cost;
                        break;
                    case '3_completionTask':
                        completedTaskNum += event.cost;
                        break;
                    }
                })
                .value();

            beforeTime = time;

            return {taskNum, completedTaskNum, totalWorkTime: Math.floor(totalWorkTime / 1000 / 60)};
        });

        return points;
    }
}

module.exports = BurnDownChart;
