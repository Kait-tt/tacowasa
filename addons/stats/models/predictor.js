'use strict';
const spawn = require('child_process').spawn;
const db = require('../schemas');
const TaskExporter = require('../models/task_exporter');

class Predictor {
    static calc (projectId, {transaction} = {}) {
        return db.coTransaction([transaction], function* (transaction) {
            const project = yield db.Project.findOne({where: {id: projectId}, transaction});
            if (!project) { throw new Error(`${projectId} was not found`); }

            const {tasks} = yield TaskExporter.exportOne(project.id);

            const members = yield db.Member.findAll({where: {projectId: project.id}, transaction});
            const userIds = members.map(x => x.userId);

            const costs = yield db.Cost.findAll({where: {projectId: project.id}, transaction});
            const costValues = costs
                .map(x => x.value)
                .filter(x => x !== 0 && x !== 99);

            const res = yield Predictor._execChild(tasks, userIds, costValues);

            return res;
        });
    }

    static _execChild (tasks, userIds, costs) {
        const src = JSON.stringify({tasks, userIds, costs});

        return new Promise((resolve, reject) => {
            let text = '';
            const child = spawn('python', [Predictor._execPath]);
            child.stdout.on('data', data => { text += data; });
            child.stderr.on('data', data => { text += data; });
            child.on('close', code => {
                if (code) {
                    reject({text, code});
                } else {
                    resolve(JSON.parse(text));
                }
            });

            child.stdin.setEncoding('utf-8');
            child.stdin.write(src + '\n');
        });
    }

    static get _execPath () {
        return `${__dirname}/../scripts/interval_predict.py`;
    }
}

module.exports = Predictor;
