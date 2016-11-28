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

        const res = yield Task.validateTaskOrder(project.id);
        if (res.errors.length) {
            console.log('Errors are found :');
            console.log(res.errors.map(x => '  ' + x).join('\n'));
            console.log('  ' + res.connections.map(xs => xs.join(' ')));
            console.log('// end');
        } else {
            console.log('Successful\n');
        }
    }
}).catch(e => console.error(e));
