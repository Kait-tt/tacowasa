'use strict';
const config = require('config');
const spawn = require('child_process').spawn;
const db = require('../schemas');
const TaskExporter = require('../models/task_exporter');

class Predictor {
    static calc (projectId, {transaction} = {}) {
        return db.transaction([transaction], async transaction => {
            const predicts = await Predictor._calc(projectId, {transaction});
            await Predictor._updateMemberStats(projectId, predicts, {transaction});
            return predicts;
        });
    }

    static _calc (projectId, {transaction} = {}) {
        return db.transaction([transaction], async transaction => {
            const project = await db.Project.findOne({where: {id: projectId}, transaction});
            if (!project) {
                throw new Error(`${projectId} was not found`);
            }

            const {tasks} = await TaskExporter.exportOne(projectId);

            const members = await db.Member.findAll({where: {projectId}, transaction});
            const userIds = members.map(x => x.userId);

            const costs = await db.Cost.findAll({where: {projectId}, transaction});
            const costValues = costs
                .map(x => x.value)
                .filter(x => x !== 0 && x !== 99);

            return await Predictor._execChild(tasks, userIds, costValues);
        });
    }

    static _updateMemberStats (projectId, predicts, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const members = await db.Member.findAll({where: {projectId}, transaction});
            const memberIds = members.map(x => x.id);
            const costs = await db.Cost.findAll({where: {projectId}, transaction});

            await db.MemberStats.destroy({where: {memberId: {in: memberIds}}, transaction});

            for (let {userId, cost: costValue, mean, low, high} of predicts) {
                const member = members.find(x => x.userId === userId);
                if (!member) { throw new Error(`member was not found: userId=${userId}`); }
                const memberId = member.id;

                const cost = costs.find(x => x.value === costValue);
                if (!cost) { throw new Error(`cost was not found: costValue=${costValue}`); }
                const costId = cost.id;

                await db.MemberStats.create({memberId, costId, mean, low, high}, {transaction});
            }
        });
    }

    static _execChild (tasks, userIds, costs) {
        const src = JSON.stringify({tasks, userIds, costs});

        return new Promise((resolve, reject) => {
            let text = '';
            const child = spawn(config.get('python.path') || 'python', [Predictor._execPath]);
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
