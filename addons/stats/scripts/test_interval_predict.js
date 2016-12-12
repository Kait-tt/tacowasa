'use strict';
const db = require('../schemas');
const TaskExporter = require('../models/task_exporter');
const Predictor = require('../models/predictor');

const projectName = 'tacowasa';

db.coTransaction({}, function* (transaction) {
    const project = yield db.Project.findOne({where: {name: projectName}, transaction});
    if (!project) { throw new Error(`${projectName} was not found`); }

    const {tasks} = yield TaskExporter.exportOne(project.id);

    const members = yield db.Member.findAll({where: {projectId: project.id}, transaction});
    const userIds = members.map(x => x.userId);

    const costs = yield db.Cost.findAll({where: {projectId: project.id}, transaction});
    const costValues = costs.map(x => x.value);

    const res = yield Predictor._execChild(tasks, userIds, costValues);
    console.log(res);
}).catch(e => console.error(e));
