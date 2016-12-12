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
    static calcAll (projectId, {transaction, force = false} = {}) {
        return db.coTransaction({transaction}, function* (transaction) {
            let doCalc = force || !(yield ProjectStats.checkCache(projectId, {transaction}));

            if (doCalc) {
                // create or update project stats, and lock
                yield db.ProjectStats.upsert({
                    projectId
                }, {fields: ['projectId'], transaction});

                yield MemberWorkTime.calcAll(projectId, {transaction});
                yield Predictor.calc(projectId, {transaction});
                yield StagnationTask.calcAll(projectId, {transaction});
                yield BurnDownChart.calc(projectId, {transaction});
            }

            const projectStats = yield db.ProjectStats.findOne({where: {projectId}, transaction});

            return {
                project: projectStats ? projectStats.toJSON() : null,
                members: yield ProjectStats.findEachMembers(projectId, {transaction}),
                iterations: yield Iteration.findByProjectId(projectId, {transaction}),
                workTimes: yield MemberWorkTime.findByProjectId(projectId, {transaction}),
                stagnantTaskIds: yield StagnationTask.findByProjectId(projectId, {transaction}),
                burnDownChart: yield BurnDownChart.findByProjectId(projectId, {transaction})
            };
        });
    }

    static findEachMembers (projectId, {transaction} = {}) {
        return db.coTransaction({transaction}, function* () {
            const members = yield db.Member.findAll({where: {projectId}, transaction});
            const res = [];
            for (let member of members) {
                const memberStats = yield db.MemberStats.findOne({where: {memberId: member.id}, transaction});
                if (memberStats) {
                    res.push(_.assign(memberStats.toJSON(), {userId: member.userId}));
                }
            }
            return res;
        });
    }

    static checkCache (projectId, {transaction} = {}) {
        return db.coTransaction({transaction}, function* () {
            const projectStats = yield db.ProjectStats.findOne({where: {projectId}, transaction});
            if (!projectStats) { return false; }
            return Date.now() - new Date(projectStats.updatedAt) < config.get('stats.cacheTime');
        });
    }
}

module.exports = ProjectStats;
