'use strict';
const _ = require('lodash');
const commander = require('commander');
const fs = require('fs');
const db = require('../schemas');
const Util = require('../modules/util');

// output = [{projectId, projectName, tasks}]
// tasks = {taskId, cost, actualWorkTime(minutes), userId} (ordered by completed time)

commander
    .option('-p, --projects [projectNames]', '(required) Target project names (e.g., aaa.bbb,ccc)')
    .option('-o, --output [path]', 'Output file path (default: stdout)')
    .option('--pretty', 'Output pretty format (default: false)')
    .parse(process.argv);


if (!commander.projects) {
    process.stderr.write(this.helpInformation());
    process.exit(1);
}

const projectNames = commander.projects.split(',').map(x => x.trim());
const output = commander.output;
const pretty = commander.pretty;

db.coTransaction({}, function* (transaction) {
    const res = [];

    for (let projectName of projectNames) {
        const project = yield db.Project.findOne({where: {name: projectName}, transaction});
        if (!project) { throw new Error(`${projectName} was not found`); }

        const tasks = yield db.Task.findAll({where: {projectId: project.id}, include: [{model: db.Work, as: 'works', separate: true}, {model: db.Cost, as: 'cost'}], transaction});
        const logs = yield db.Log.findAll({where: {projectId: project.id, action: {in: ['archiveTask', 'updateTaskStatus', 'updateTaskStatusAndOrder']}}, transaction});

        const completedTimes = calcTaskCompletedTime(logs.map(x => x.toJSON()));

        const tasksWithTime = _.chain(tasks)
            .filter(task => task.works && task.works.length)
            .filter(task => task.works.length === _.filter(task.works, {userId: task.works[0].userId}).length)
            .map(task => {
                const workTime = Util.calcSumWorkTime(task.works);
                const log = completedTimes.find(x => x.taskId === task.id);
                return log ? {
                    taskId: task.id,
                    cost: task.cost.value,
                    userId: task.works[0].userId,
                    actualWorkTime: Math.floor(workTime / 1000 / 60),
                    completedTime: log.time,
                    isCompleted: log.isCompleted
                } : null;
            })
            .filter(task => task && task.completedTime && task.actualWorkTime && task.cost)
            .sortBy('completedTime')
            .map(task => _.pick(task, ['taskId', 'cost', 'userId', 'actualWorkTime']))
            .value();

        res.push({
            projectId: project.id,
            projectName: project.name,
            tasks: tasksWithTime
        });
    }

    return res;
})
    .then(res => {
        const outstr = JSON.stringify(res, null, pretty ? '  ' : '');
        if (output) {
            fs.writeFileSync(output, outstr);
            console.log(`Created ${output}`);
        } else {
            console.log(outstr);
        }
    })
    .catch(e => console.error(e));

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
            return {taskId: Number(taskId), time: lastCompletedTime, isCompleted: lastCompletedTime > 0};
        })
        .value();
}
