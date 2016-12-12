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

            const members = yield db.Member.findAll({where: {projectId}, transaction});
            const userIds = members.map(x => x.userId);

            const costs = yield db.Cost.findAll({where: {projectId}, transaction});
            const costValues = costs
                .map(x => x.value)
                .filter(x => x !== 0 && x !== 99);

            const predicts = yield Predictor._execChild(tasks, userIds, costValues);

            yield Predictor._updateMemberStats(projectId, predicts, {transaction});

            return predicts;
        });
    }

    static _updateMemberStats (projectId, predicts, {transaction} = {}) {
        return db.coTransaction({transaction}, function* (transaction) {
            const members = yield db.Member.findAll({where: {projectId}, transaction});
            const memberIds = members.map(x => x.id);
            const costs = yield db.Cost.findAll({where: {projectId}, transaction});

            yield db.MemberStats.destroy({where: {memberId: {in: memberIds}}, transaction});

            for (let {userId, cost: costValue, mean, low, high} of predicts) {
                const member = members.find(x => x.userId === userId);
                if (!member) { throw new Error(`member was not found: userId=${userId}`); }
                const memberId = member.id;

                const cost = costs.find(x => x.value === costValue);
                if (!cost) { throw new Error(`cost was not found: costValue=${costValue}`); }
                const costId = cost.id;

                yield db.MemberStats.create({memberId, costId, mean, low, high}, {transaction});
            }
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
