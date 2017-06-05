'use strict';
const commander = require('commander');
const fs = require('fs');
const _ = require('lodash');
const moment = require('moment');
const {min, max, floor, ceil} = Math;
const db = require('../../../lib/schemes');
const Predictor = require('../models/predictor');
const TaskExporter = require('../models/task_exporter');

commander
    .option('--source [path]', '(required) Source tsv file')
    .option('--output [path]', 'Output file path (default: stdout)')
    .option('--start [date]', '(required) Start date (e.g, 2017-04-01)')
    .option('--end [date]', '(required) End date (e.g., 2017-05-01)')
    .parse(process.argv);


if (!commander.source || !commander.start || !commander.end) {
    process.stderr.write(commander.helpInformation());
    process.exit(1);
}

main(commander)
    .then(() => {
        console.log('Completed.\n');
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });

async function main ({source: sourcePath, output: outputPath, start: startDate, end: endDate}) {
    const works = loadTsv(sourcePath);

    await expandWorks(works);

    const users = _.uniqBy(works.map(x => x.user), 'username');
    const costs = _.uniq(works.map(x => x.cost), 'value');
    const projectId = costs[0].projectId; // ここ良くない

    for (let user of users) {
        for (let cost of costs) {
            const filteredWorks = works.filter(x => x.user.username === user.username && x.cost.value === cost.value);
            if (!filteredWorks.length) { continue; }

            const timelines = convertToTimeline(filteredWorks, startDate, endDate);

            const predicts = await predictWorktimeAllTimeline(projectId, user.id, cost.value, startDate, endDate);

            const outstr = convertToTsv(timelines, predicts);

            if (outputPath) {
                const matched = outputPath.match(/(.*)\.(\w+)$/);
                let path;
                if (matched) {
                    path = `${matched[1]}_${user.username}_${cost.value}.${matched[2]}`;
                } else {
                    path = `${outputPath}_${user.username}_${cost.value}`;
                }

                fs.writeFileSync(path, outstr);
                console.log(`${path} was created`);
            } else {
                console.log(outstr);
            }
        }
    }
}

async function expandWorks (works) {
    const memoTasks = {};
    const memoUsers = {};
    const memoCosts = {};

    for (let work of works) {
        const {taskId, userId} = work;

        let task = memoTasks[taskId];
        if (!task) {
            task = (await db.Task.findOne({where: {id: taskId}})).toJSON();
            memoTasks[taskId] = task;
        }

        let user = memoUsers[userId];
        if (!user) {
            user = (await db.User.findOne({where: {id: userId}})).toJSON();
            memoUsers[userId] = user;
        }

        const costId = task.costId;
        let cost = memoCosts[costId];
        if (!cost) {
            cost = (await db.Cost.findOne({where: {id: costId}})).toJSON();
            memoCosts[costId] = cost;
        }

        work.task = task;
        work.user = user;
        work.cost = cost;
    }
}

function loadTsv (path) {
    const contents = fs.readFileSync(path, 'utf8');
    const lines = contents.split('\n').filter(x => x).map(line => line.split('\t'));
    const header = lines.shift();
    return lines.map(line => _.zipObject(header, line));
}

function convertToTimeline (src, startDate, endDate) {
    const taskIds = _.chain(src).map('taskId').uniq().value();
    const timelines = {}; // timelines[taskId][elapsed hour] = continuous work time
    const startMoment = moment(startDate);
    const endMoment = moment(endDate);
    const duration = endMoment.diff(startMoment, 'hours') + 1;

    taskIds.forEach(taskId => {
        const works = _.sortBy(src.filter(work => work.taskId === taskId), 'startTime');
        const timeline = Array(duration).fill(0);

        works.forEach(work => {
            const workStartMoment = moment(work.startTime);
            const workEndMoment = moment(work.endTime);
            const s = floor(max(min(endMoment.diff(workStartMoment, 'seconds') / 60 / 60, duration - 1), 0));
            const e = floor(max(min(endMoment.diff(workEndMoment, 'seconds') / 60 / 60 + 1, duration - 1), 0));
            const e2 = ceil(max(min(endMoment.diff(workEndMoment, 'seconds') / 60 / 60 + 1, duration - 1), 0));
            for (let i = floor(s), lim = ceil(e); i < lim; ++i) {
                timeline[i] += 1;
            }

            const diff = workEndMoment.diff(workStartMoment, 'seconds') / 60 / 60;
            timeline[e2] += diff - floor(diff);
        });

        let sum = 0;
        for (let i = 0; i < duration; ++i) {
            if (timeline[i]) {
                if (i) {
                    timeline[i - 1] = sum;
                }
                sum += timeline[i];
                timeline[i] = sum;
            } else {
                timeline[i] = null;
            }
        }

        timelines[taskId] = timeline;
    });

    return timelines;
}

function convertToTsv (timelines, predicts) {
    const taskIds = Object.keys(timelines);
    if (!taskIds.length) { return ''; }
    const predictKeys = Object.keys(predicts);

    const lines = [['Days'].concat(taskIds.slice()).concat(predictKeys.slice())];
    const n = timelines[taskIds[0]].length;
    const m = predicts[predictKeys[0]].length;
    console.assert(n === m, `${n} ${m}`);

    for (let i = 0; i < n; ++i) {
        const line1 = taskIds.map(taskId => timelines[taskId][i]);
        const line2 = predictKeys.map(key => predicts[key][i]);
        const days = floor(i / 24);
        const hours = i % 24;
        const line = _.flatten([`${days}:${hours}`, line1, line2]);
        lines.push(line);
    }

    return lines.map(line => line.join('\t')).join('\n');
}

async function predictWorktimeAllTimeline (projectId, userId, cost, startDate, endDate) {
    const {tasks} = await TaskExporter.exportOne(projectId);

    const predictKeys = ['mean', 'low', 'high'];
    const timelines = {mean: [], low: [], high: []};
    const endMoment = moment(endDate).add(1, 'hours');
    let currentMoment = moment(startDate);

    let beforeLength = null;
    let before = null;

    while (currentMoment.isBefore(endMoment)) {
        const filteredTasks = tasks.filter(x => currentMoment.isAfter(x.completedAt));
        if (filteredTasks.length === beforeLength) {
            predictKeys.forEach(key => timelines[key].push(before[key]));
        } else {
            const predicted = await predictWorkTime(filteredTasks, userId, cost);
            beforeLength = filteredTasks.length;
            before = predicted;
            predictKeys.forEach(key => timelines[key].push(predicted[key]));
        }

        currentMoment.add(1, 'hours');
    }

    return timelines;
}

async function predictWorkTime (tasks, userId, cost) {
    return Predictor._execChild(tasks, [userId], [cost]).then(x => x[0].mean ? {
        mean: x[0].mean / 60,
        low: x[0].low / 60,
        high: x[0].high / 60
    } : x[0]);
}
