'use strict';
const commander = require('commander');
const Task = require('../lib/models/task');
const db = require('../lib/schemes');
const co = require('co');

commander
    .option('-p, --project [projectId]', 'Target projectId as MySQL like format (e.g., %ABC%). defaults to %')
    .parse(process.argv);

co(function* () {
    const projects = yield db.Project.findAll({where: {id: {$like: commander.project}, enabled: true}});

    for (let project of projects) {
        console.log(`Start ${project.name} ${project.id}`);
        try {
            yield Task.validateTaskOrder(project.id);
            console.log('Successful');
        } catch (e) {
            console.error(e);
        }
    }
}).catch(e => console.error(e));
