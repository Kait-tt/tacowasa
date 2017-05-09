'use strict';
const fs = require('fs');
const _ = require('lodash');
const commander = require('commander');
const moment = require('moment');
const db = require('../addons/github/schemas');


commander
    .option('-s, --src [path]', '(required) Source directiory path')
    .parse(process.argv);

if (!commander.src) {
    process.stderr.write(this.helpInformation());
    process.exit(1);
}

function serializeMongoJSON (str) {
    return _.compact(str.split('\n')).map(x => {
        x = x.replace(/NumberInt\((\d+)\)/g, '$1');
        x = x.replace(/{"\$date":"(.+?)"}/g, '"$1"');
        x = x.replace(/{"\$oid":"(.+?)"}/g, '"$1"');
        return JSON.parse(x);
    });
}

const srcProjects = serializeMongoJSON(fs.readFileSync(`${commander.src}/projects.json`, 'utf8'));
const srcLogs = serializeMongoJSON(fs.readFileSync(`${commander.src}/logs.json`, 'utf8'));
const changeLogs = pickChangeStateLog(srcLogs);

const _sid = setTimeout(() => {}, 100000); // for error catch

db.transaction(async transaction => {
    for (let {id: projectId, name, issues} of srcProjects) {
        const project = await db.Project.findOne({where: {id: projectId}, transaction});
        if (!project) {
            console.log(`${name} project was not found`);
            continue;
        }

        console.log(`sync : ${name} project...`);

        for (let {_id, title, github, created_at: createdAt} of issues) {
            const githubTask = await db.GitHubTask.findOne({where: {projectId, number: github.number}, transaction});
            if (!githubTask) {
                throw new Error(`github task was not found : ${title}`);
            }
            let task = await db.Task.findOne({where: {id: githubTask.taskId}, include: [{model: db.Stage, as: 'stage'}], transaction});
            if (!task) {
                throw new Error(`task was not found: ${title}`);
            }

            // update created at
            if (createdAt && Number(new Date(task.createdAt)) !== Number(new Date(createdAt))) {
                console.log(`fix createdAt of ${task.id} to ${new Date(createdAt)} from ${new Date(task.createdAt)}`);
                const createdAtStr = moment(createdAt).utcOffset('+00:00').format();
                await db.sequelize.query(`update tasks set createdAt = "${createdAtStr}" where id = ${task.id}`);
            }

            task = await db.Task.findOne({where: {id: githubTask.taskId}, include: [{model: db.Stage, as: 'stage'}], transaction});

            // update completed at
            const taskLogs = _.filter(changeLogs, {issueId: _id});
            let completedAt = 0;
            taskLogs.forEach(x => {
                if (_.includes(['done', 'archive'], x.stage)) {
                    if (!completedAt) {
                        completedAt = x.createdAt;
                    }
                } else {
                    completedAt = 0;
                }
            });

            if (completedAt && _.includes(['done', 'archive'], task.stage.name)) {
                console.log(`fix completedAt of ${task.id} to ${new Date(completedAt)} from ${new Date(task.completedAt)}`);
                await task.update({completedAt: new Date(completedAt)}, {transaction});
            }
        }
    }
})
    .then(() => {
        clearTimeout(_sid);
        console.log('Successful!');
    })
    .catch(e => console.error(e));

function pickChangeStateLog (logs) {
    return _.chain(logs)
        .filter(x => x.values)
        .filter(x => x.values.type && x.values.type === 'socket')
        .filter(x => x.values.action && x.values.action === 'emit')
        .filter(x => _.includes(['update-stage', 'remove-issue'], x.values.key))
        .map(x => {
            const req = x.values.req;
            return {
                issueId: req.issueId || req.issue._id,
                stage: req.toStage || req.issue.stage,
                createdAt: new Date(x.created_at)
            };
        })
        .tap(xs => {
            xs.forEach(x => {
                if (!x.issueId || !x.stage || !x.createdAt) {
                    throw new Error('invalid log', x);
                }
            });
        })
        .sortBy('createdAt')
        .value();
}
