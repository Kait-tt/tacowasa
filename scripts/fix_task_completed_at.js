'use strict';
const _ = require('lodash');
const db = require('../lib/schemes');

db.coTransaction({}, function* (transaction) {
    const projects = yield db.Project.findAll({transaction});

    for (let project of projects) {
        console.log(`start fix project : ${project.name}`);

        const tasks = yield db.Task.findAll({where: {projectId: project.id}, include: [{model: db.Stage, as: 'stage'}], transaction});
        let logs = yield db.Log.findAll({
            where: {
                projectId: project.id,
                action: {in: ['archiveTask', 'updateTaskStatus', 'updateTaskStatusAndOrder']}
            },
            transaction
        });
        logs = logs.map(x => x.toJSON());

        const completedTimes = calcTaskCompletedTime(logs);

        for (let task of tasks) {
            const log = completedTimes.find(x => x.taskId === task.id);
            if (log) {
                if (Number(task.completedAt) !== Number(log.time)) {
                    console.log(`fix ${task.id}.completedAt to ${new Date(log.time)}`);
                    yield db.Task.update({completedAt: new Date(log.time)}, {where: {id: task.id}, transaction});
                }
            } else if (!task.completedAt && _.includes(['done', 'archive'], task.stage.name)) {
                console.log(`fix ${task.id}.completedAt to createdAt`);
                yield db.Task.update({completedAt: task.createdAt}, {where: {id: task.id}, transaction});
            }
        }
    }
}).then(() => console.log('Successful!'));

function calcTaskCompletedTime (logs) {
    return _.chain(logs)
        .map(log => {
            log.content = JSON.parse(log.content);
            log.taskId = log.content.task.id;
            return log;
        })
        .groupBy('taskId')
        .map((statusLogs, taskId) => {
            let lastCompletedTime = 0;
            statusLogs.forEach(log => {
                if (_.includes(['done', 'archive'], log.content.task.stage.name)) {
                    if (!lastCompletedTime) {
                        lastCompletedTime = Number(log.createdAt);
                    }
                } else {
                    lastCompletedTime = 0;
                }
            });
            return {taskId: Number(taskId), time: lastCompletedTime};
        })
        .filter(x => x.time)
        .value();

}
