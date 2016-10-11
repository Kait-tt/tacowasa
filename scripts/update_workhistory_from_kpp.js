'use strict';
const co = require('co');
const _ = require('lodash');
const fs = require('fs');
const db = require('../addons/github/schemas');
const Project = require('../lib/models/project');
const Task = require('../lib/models/task');

const inputDir = findInputDir();
if (!inputDir) {
    console.error(usage());
    process.exit(1);
}

if (existsHelp()) {
    console.log(usage());
    process.exit(1);
}

main();

function existsHelp () {
    const xs = process.argv.slice(2);
    return xs.indexOf('-h') !== -1 || xs.indexOf('--help') !== -1;
}

function findInputDir () {
    const xs = process.argv.slice(2);
    const pos = xs.indexOf('-o') + 1;
    if (!pos) { return null; }
    return xs[pos];
}

function usage () {
    return `
Usage:
  node ${process.argv[1]} -o <input_dir>
`;
}

function serializeMongoJSON (str) {
    return _.compact(str.split('\n')).map(x => {
        x = x.replace(/NumberInt\((\d+)\)/g, '$1');
        x = x.replace(/{"\$date":"(.+?)"}/g, '"$1"');
        x = x.replace(/{"\$oid":"(.+?)"}/g, '"$1"');
        return JSON.parse(x);
    });
}

function updateWorkHistory ({transaction} = {}) {
    const srcProjects = serializeMongoJSON(fs.readFileSync(`${inputDir}/projects.json`, 'utf8'));

    return co(function* () {
        for (let {id, issues} of srcProjects) {
            const project = yield Project.findById(id, {transaction});
            console.log(`target project: ${project.name} project...`);

            for (let {title, workHistory: srcWorks, github: {number: githubNumber}} of issues) {
                console.log(`target task: ${title}`);

                const githubTask = yield db.GitHubTask.findOne({where: {projectId: project.id, number: String(githubNumber)}, transaction});
                const task = yield db.Task.findOne({where: {id: githubTask.taskId}, transaction});

                const oldWorks = yield db.Work.findAll({where: {taskId: task.id}, transaction});

                const works = [];

                for (let i = 0; i < oldWorks.length; i++) {
                    works.push({
                        isEnded: Boolean(oldWorks[i].endTime || srcWorks[i].endTime),
                        startTime: oldWorks[i].startTime,
                        endTime: oldWorks[i].endTime || srcWorks[i].endTime,
                        userId: oldWorks[i].userId,
                        taskId: oldWorks[i].taskId
                    });
                }

                // validate
                for (let {startTime, endTime, isEnded} of works) {
                    if (isEnded && (!startTime || !endTime)) { throw new Error(`invalid work time: ${startTime}, ${endTime}`); }
                    if (!endTime ^ !isEnded) { throw new Error(`invalid work end time: ${endTime}, ${isEnded}`); }
                    if (isEnded && new Date(startTime) > new Date(endTime)) {
                        throw new Error(`invalid work time order: ${startTime}, ${endTime}`);
                    }
                }

                yield Task.updateWorkHistory(project.id, task.id, works, {transaction});
            }
        }
    });
}

function main () {
    db.sequelize.transaction(transaction => co(function* () {
        console.log('update work history...');
        yield updateWorkHistory({transaction});
        console.log('done');
        return Promise.reject('test reject'); // for test
    })).catch(err => console.error(err));
}

