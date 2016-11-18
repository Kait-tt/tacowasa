'use strict';
const _ = require('lodash');
const db = require('../schemas');

class MemberWorkTime {
    static findByProjectIdAndUserId (projectId, userId, options = {}) {
        return db.coTransaction({transaction: options.transaction}, function* (transaction) {
            const member = yield db.Member.findOne({where: {projectId, userId}, transaction});
            if (!member) { return []; }
            const workTimes = db.MemberWorkTime.findAll(_.assign({memberId: member.id}, options, {transaction}));
            return workTimes.map(x => x.toJSON());
        });
    }

    static findByProjectId (projectId, options = {}) {
        return db.coTransaction({transaction: options.transaction}, function* (transaction) {
            const members = yield db.Member.findAll({where: {projectId}, transaction});
            const res = [];
            for (let member of members) {
                const workTimes = yield db.MemberWorkTime.findAll(_.assign({where: {memberId: member.id}}, options, {transaction}));
                workTimes.forEach(workTime => {
                    res.push(_.assign(workTime.toJSON(), {userId: member.userId}));
                });
            }
            return res;
        });
    }

    static create (projectId, userId, iterationId, {promisedMinutes, actualMinutes = 0}, {transaction} = {}) {
        return db.coTransaction({transaction}, function* (transaction) {
            const member = yield db.Member.findOne({where: {projectId, userId}, transaction});
            if (!member) { throw new Error(`member was not found given {projectId: ${projectId}, userId: ${userId}}`); }

            const res = yield db.MemberWorkTime.create({
                memberId: member.id,
                projectId,
                iterationId,
                promisedMinutes,
                actualMinutes
            });

            return res.toJSON();
        });
    }
}

module.exports = MemberWorkTime;

