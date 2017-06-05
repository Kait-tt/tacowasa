'use strict';
const commander = require('commander');
const fs = require('fs');
const _ = require('lodash');
const moment = require('moment');
const {min, max, floor, ceil} = Math;
const db = require('../../../lib/schemes');

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

    const usernames = _.uniq(works.map(x => x.user.username));
    const costValues = _.uniq(works.map(x => x.cost.value));

    for (let username of usernames) {
        for (let costValue of costValues) {
            const filteredWorks = works.filter(x => x.user.username === username && x.cost.value === costValue);
            if (!filteredWorks.length) { continue; }

            const timelines = convertToTimeline(filteredWorks, startDate, endDate);

            const outstr = convertToTsv(timelines);

            if (outputPath) {
                const matched = outputPath.match(/(.*)\.(\w+)$/);
                let path;
                if (matched) {
                    path = `${matched[1]}_${username}_${costValue}.${matched[2]}`;
                } else {
                    path = `${outputPath}_${username}_${costValue}`;
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

function convertToTsv (timelines) {
    const taskIds = Object.keys(timelines);
    if (!taskIds.length) { return ''; }

    const lines = [['Days'].concat(taskIds.slice())];
    const n = timelines[taskIds[0]].length;

    for (let i = 0; i < n; ++i) {
        const line = taskIds.map(taskId => timelines[taskId][i]);
        const days = floor(i / 24);
        const hours = i % 24;
        line.unshift(`${days}:${hours}`);
        lines.push(line);
    }

    return lines.map(line => line.join('\t')).join('\n');
}
