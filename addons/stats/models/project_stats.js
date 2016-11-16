'use strict';
const _ = require('lodash');
const config = require('config');
const db = require('../schemas');
const Throughput = require('./throughput');

class ProjectStats {
    static calcAll (projectId, {transaction, force = false} = {}) {
        return db.coTransaction({transaction}, function* () {
            let doCalc = force || !(yield ProjectStats.checkCache(projectId, {transaction}));

            if (doCalc) {
                // create or update project stats, and lock
                yield db.ProjectStats.upsert({
                    projectId,
                    throughput: 0,
                    updatedAt: Date()
                }, {where: {projectId}, transaction});

                yield Throughput.calcAll(projectId, {transaction});
            }

            const projectStats = yield db.ProjectStats.findOne({where: {projectId}, transaction});

            return {
                project: projectStats ? projectStats.toJSON() : null,
                members: yield ProjectStats.findEachMembers(projectId, {transaction})
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
            return Date.now() - new Date(projectStats.updatedAt) < ProjectStats.cacheTime;
        });
    }

    static get cacheTime () {
        return config.get('stats.cacheTime');
    }
}

module.exports = ProjectStats;
