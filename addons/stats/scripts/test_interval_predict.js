'use strict';
const db = require('../schemas');
const Predictor = require('../models/predictor');

const projectName = 'tacowasa';

db.transaction(async transaction => {
    const project = await db.Project.findOne({where: {name: projectName}, transaction});
    if (!project) { throw new Error(`${projectName} was not found`); }

    const res = await Predictor._calc(project.id, {transaction});
    console.log(res);
}).catch(e => console.error(e));
