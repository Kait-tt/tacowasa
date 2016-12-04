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
            let completedAt = null;
            if (log) {
                completedAt = log.time;
            } else if (_.includes(['done', 'archive'], task.stage.name)) {
                completedAt = task.createdAt;
            }

            if (completedAt) {
                console.log(`fix ${task.id}.completedAt to ${completedAt}`);
                yield db.Task.update({completedAt}, {where: {id: task.id}, transaction});
            }
        }
    }
});

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
