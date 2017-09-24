'use strict';
const _ = require('lodash');
const config = require('config');
const db = require('../schemas');
const Iteration = require('./iteration');
const MemberWorkTime = require('./member_work_time');
const StagnationTask = require('./stagnation_task');
const BurnDownChart = require('./burn_down_chart');
const Predictor = require('./predictor');

class ProjectStats {
    static async calcAll (projectId, {transaction, force = false} = {}) {
        // no new transaction
        const expired = !(await ProjectStats.checkCache(projectId, {transaction}));
        const doCalc = force || expired;

        if (doCalc) {
            // create or update project stats, and lock
            await db.ProjectStats.upsert({
                projectId
            }, {fields: ['projectId'], transaction});

            await MemberWorkTime.calcAll(projectId, {transaction});
            await Predictor.calc(projectId, {transaction});
            await StagnationTask.calcAll(projectId, {transaction});
            await BurnDownChart.calc(projectId, {transaction});
        }

        const projectStats = await db.ProjectStats.findOne({where: {projectId}, transaction});

        return {
            project: projectStats ? projectStats.toJSON() : null,
            members: await ProjectStats.findEachMembers(projectId, {transaction}),
            iterations: await Iteration.findByProjectId(projectId, {transaction}),
            workTimes: await MemberWorkTime.findByProjectId(projectId, {transaction}),
            stagnantTaskIds: await StagnationTask.findByProjectId(projectId, {transaction}),
            burnDownChart: await BurnDownChart.findByProjectId(projectId, {transaction})
        };
    }

    static findEachMembers (projectId, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const members = await db.Member.findAll({where: {projectId}, transaction});
            const res = [];
            for (let member of members) {
                const memberStats = await db.MemberStats.findAll({where: {memberId: member.id}, transaction});
                for (let stats of memberStats) {
                    res.push(_.assign(stats.toJSON(), {userId: member.userId}));
                }
            }
            return res;
        });
    }

    static checkCache (projectId, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const projectStats = await db.ProjectStats.findOne({where: {projectId}, transaction});
            if (!projectStats) { return false; }
            return Date.now() - new Date(projectStats.updatedAt) < config.get('stats.cacheTime');
        });
    }
}

module.exports = ProjectStats;
