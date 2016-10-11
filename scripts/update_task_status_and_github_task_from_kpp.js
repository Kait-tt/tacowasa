'use strict';
const co = require('co');
const _ = require('lodash');
const fs = require('fs');
const db = require('../addons/github/schemas');
const Task = require('../lib/models/task');
const GitHubAPI = require('../addons/github/models/github_api');

if (existsHelp()) {
    console.log(usage());
    process.exit(0);
}

const inputDir = findOption('-o');
const githubToken = findOption('-t');
const projectId = findOption('-p');
if (!inputDir || !githubToken || !projectId) {
    console.error(usage());
    process.exit(1);
}

main();

function existsHelp () {
    const xs = process.argv.slice(2);
    return xs.indexOf('-h') !== -1 || xs.indexOf('--help') !== -1;
}

function findOption (optStr) {
    const xs = process.argv.slice(2);
    const pos = xs.indexOf(optStr) + 1;
    return pos ? xs[pos] : null;
}

function usage () {
    return `
Usage:
  node ${process.argv[1]} -o <input_dir> -t <github_token> -p <project_id>
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

const users = [];

function findUsers () {
    const srcUsers = serializeMongoJSON(fs.readFileSync(`${inputDir}/users.json`, 'utf8'));
    return co(function* () {
        for (let {_id, userName: username} of srcUsers) {
            const user = yield db.User.findOne({where: {username}});
            users.push(_.assign({_id}, user.toJSON()));
        }
    });
}

function updateTaskStatus () {
    const srcProjects = serializeMongoJSON(fs.readFileSync(`${inputDir}/projects.json`, 'utf8'));
    const githubApi = new GitHubAPI(githubToken);

    return co(function* () {
        const project = _.find(srcProjects, {id: projectId});
        if (!project) { throw new Error(`project was not found: ${projectId}`); }

        for (let {assignee, stage, github: {number: githubNumber}} of project.issues) {
            const githubTask = yield db.GitHubTask.findOne({where: {projectId: project.id, number: String(githubNumber)}});
            const task = yield db.Task.findOne({
                where: {
                    id: githubTask.taskId
                },
                include: [
                    {model: db.Stage, as: 'stage'},
                    {model: db.User, as: 'user'}
                ]});

            let username = null;
            let stageName = stage;

            if (assignee) {
                const user = _.find(users, {_id: assignee});
                if (!user) { throw new Error(`user not found: ${assignee}`); }
                username = user.username;
            }

            const curUsername = task.user ? task.user.username : null;
            if (task.stage.name === stageName && curUsername === username) { continue; }

            console.log(`update task: ${task.title} , id : ${task.id} , number : ${githubTask.number}`);

            const nextStage = yield db.Stage.findOne({where: {projectId, name: stageName}});
            const nextUser = username ? (yield db.User.findOne({where: {username}})) : null;
            yield Task.updateStatus(projectId, task.id, {
                userId: nextUser ? nextUser.id : null,
                stageId: nextStage.id
            });

            const updatedTask = yield Task.findById(task.id);
            if (nextUser && nextUser.username !== 'snakazawa') {
                updatedTask.user = null;
            }
            yield githubApi.updateTask(projectId, updatedTask);
        }
    });
}

function main () {
    co(function* () {
        console.log('find users...');
        yield findUsers();
        console.log('done');
        console.log('update task status...');
        yield updateTaskStatus();
        console.log('done');
        // return Promise.reject('test reject'); // for test
    }).catch(err => console.error(err));
}

