'use strict';
const db = require('../schemas');
const Predictor = require('../models/predictor');

const projectName = 'tacowasa';

db.coTransaction({}, function* (transaction) {
    const project = yield db.Project.findOne({where: {name: projectName}, transaction});
    if (!project) { throw new Error(`${projectName} was not found`); }

    const res = yield Predictor.calc(project.id, {transaction});
    console.log({res});
}).catch(e => console.error(e));
