'use strict';
const spawn = require('child_process').spawn;
const db = require('../schemas');
const TaskExporter = require('../models/task_exporter');

const projectName = 'tacowasa';

db.coTransaction({}, function* (transaction) {
    const project = yield db.Project.findOne({where: {name: projectName}, transaction});
    if (!project) { throw new Error(`${projectName} was not found`); }

    const {tasks} = yield TaskExporter.exportOne(project.id);

    const members = yield db.Member.findAll({where: {projectId: project.id}, transaction});
    const userIds = members.map(x => x.userId);

    const costs = yield db.Cost.findAll({where: {projectId: project.id}, transaction});
    const costValues = costs.map(x => x.value);

    const src = JSON.stringify({tasks, userIds, costs: costValues});

    const pythonFile = `${__dirname}/interval_predict.py`;

    const child = spawn('python', [pythonFile]);
    child.stdout.on('data', data => console.log(`stdout: ${data}`));
    child.stderr.on('data', data => console.log(`stderr: ${data}`));
    child.on('close', code => {
        console.log(`exited with code: ${code}`);
    });

    child.stdin.setEncoding('utf-8');
    child.stdin.write(src + '\n');
}).catch(e => console.error(e));
