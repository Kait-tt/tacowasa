'use strict';
const co = require('co');
const _ = require('lodash');
const fs = require('fs');
const db = require('../addons/github/schemas');
const Project = require('../lib/models/project');
const Member = require('../lib/models/member');
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

const users = [];
const projects = [];

function serializeMongoJSON (str) {
    return _.compact(str.split('\n')).map(x => {
        x = x.replace(/NumberInt\((\d+)\)/g, '$1');
        x = x.replace(/{"\$date":"(.+?)"}/g, '"$1"');
        x = x.replace(/{"\$oid":"(.+?)"}/g, '"$1"');
        return JSON.parse(x);
    });
}

function importUser ({transaction} = {}) {
    const srcUsers = serializeMongoJSON(fs.readFileSync(`${inputDir}/users.json`, 'utf8'));
    return co(function* () {
        for (let {_id, userName: username, created_at: createdAt} of srcUsers) {
            const user = yield db.User.create({username, createdAt}, {transaction});
            users.push(_.assign({_id}, user.toJSON()));
        }
    });
}

function importProject ({transaction} = {}) {
    const srcProjects = serializeMongoJSON(fs.readFileSync(`${inputDir}/projects.json`, 'utf8'));

    return co(function* () {
        for (let {id, name, members, issues, labels, github, create_user: srcCreateUserId, created_at: createdAt} of srcProjects) {
            console.log(`import: ${name} project...`);

            // create project and init
            const createUser = _.find(users, {_id: srcCreateUserId});
            if (!createUser) { throw new Error('create user not found'); }
            let project = yield db.Project.create({id, name, createUserId: createUser.id, createdAt}, {transaction});
            yield Project.createDefaultAccessLevels(project.id, {transaction});
            yield Project.createDefaultStages(project.id, {transaction});
            yield Project.createDefaultCosts(project.id, {transaction});
            const defaultAccessLevel = yield db.AccessLevel.findOne({where: {projectId: project.id, name: 'Developer'}, transaction});
            const defaultStage = yield db.Stage.findOne({where: {projectId: project.id, name: 'issue'}, transaction});
            const defaultCost = yield db.Cost.findOne({where: {projectId: project.id, name: 'undecided'}, transaction});
            yield project.update({
                defaultAccessLevelId: defaultAccessLevel.id,
                defaultStageId: defaultStage.id,
                defaultCostId: defaultCost.id
            }, {transaction});
            project = yield Project.findById(project.id, {transaction});

            // add owner as member
            const ownerAccessLevel = yield db.AccessLevel.findOne({where: {projectId: project.id, name: 'Owner'}, transaction});
            yield Member.add(project.id, createUser.username, {
                wipLimit: project.defaultWipLimit,
                accessLevelId: ownerAccessLevel.id
            }, {transaction});

            // add github
            yield db.GitHubRepository.create({
                projectId: project.id,
                username: github.userName,
                reponame: github.repoName,
                sync: github.sync,
                hookId: github.hook.id
            });

            // add members
            for (let {user: srcUserId, created_at: createdAt, visible, wipLimit} of members) {
                const user = _.find(users, {_id: srcUserId});
                if (!user) { throw Error('user not found'); }
                if (user.username === createUser.username) { continue; }

                yield Member.add(project.id, user.username, {
                    wipLimit,
                    isVisible: visible,
                    accessLevelId: project.defaultAccessLevelId
                }, {transaction});
                yield db.Member.update({createdAt}, {where: {projectId: project.id, userId: user.id}, transaction});
            }

            // add labels
            const oldLabels = [];
            for (let {_id, color, created_at: createdAt, name} of labels) {
                const label = yield db.Label.create({projectId: project.id, name, color, createdAt}, {transaction});
                oldLabels.push(_.assign({_id}, label.toJSON()));
            }

            // add tasks
            for (let {title, body, stage: oldStage, assignee: oldUserId, cost: oldCost, isWorking, workHistory, github, labels, createdAt} of issues) {
                console.log(`import task: ${title}`);
                const stage = _.find(project.stages, {name: oldStage});
                if (!stage) { throw Error(`stage not found: ${oldStage}`); }
                const user = _.find(users, {_id: oldUserId});
                if (oldUserId && !user) { throw Error(`user not found: ${oldUserId}`); }
                const cost = _.find(project.costs, {value: oldCost || 0});
                if (!cost) { throw Error(`cost not found: ${oldCost}`); }
                const labelIds = [];
                for (let labelOldId of labels) {
                    const label = _.find(oldLabels, {_id: labelOldId});
                    if (!label) { throw new Error(`label not found: ${labelOldId}`); }
                    labelIds.push(label.id);
                }

                const task = yield Task.create(project.id, {
                    title,
                    body: body || '',
                    stageId: stage.id,
                    userId: user ? user.id : null,
                    costId: cost.id,
                    labelIds
                }, {transaction});
                yield db.Task.update({createdAt}, {where: {id: task.id}, transaction});

                if (isWorking) {
                    yield db.Task.update({isWorking: true}, {where: {id: task.id}, transaction});
                }

                yield db.GitHubTask.create({number: github.number, projectId: project.id, taskId: task.id});

                // work history
                for (let {startTime, endTime, isEnded, userId: oldUserId} of workHistory || []) {
                    if (isEnded && (!startTime || !endTime)) { throw new Error(`invalid work time: ${startTime}, ${endTime}`); }
                    if ((endTime && !isEnded)) { throw new Error(`invalid work end time: ${endTime}, ${isEnded}`); }
                    if ((!endTime && isEnded)) { throw new Error(`invalid work end time: ${endTime}, ${isEnded}`); }
                    if (!oldUserId) { throw new Error(`invalid not user work ${oldUserId}`); }

                    const start = new Date(startTime);
                    const end = endTime && new Date(endTime) || null;

                    if (end && start > end) { throw new Error(`invalid work time order: ${startTime}, ${endTime}`); }

                    const user = _.find(users, {_id: oldUserId});
                    if (!user) { throw new Error(`user not found: ${oldUserId}`); }

                    yield db.Work.create({startTime, isEnded, userId: user.id, taskId: task.id});
                }
            }

            projects.push(project);
        }
    });
}

function main () {
    db.sequelize.transaction(transaction => co(function* () {
        console.log('import users...');
        yield importUser({transaction});
        console.log('done');
        console.log('import projects...');
        yield importProject({transaction});
        console.log('done');
        return Promise.reject('test reject'); // for test
    })).catch(err => console.error(err));
}

