'use strict';
const _ = require('lodash');
const db = require('../schemas');

class MemberWorkTime {
    static findByProjectIdAndUserId (projectId, userId, options = {}) {
        return db.transaction({transaction: options.transaction}, async transaction => {
            const member = await db.Member.findOne({where: {projectId, userId}, transaction});
            if (!member) { return []; }
            const workTimes = db.MemberWorkTime.findAll(_.assign({memberId: member.id}, options, {transaction}));
            return workTimes.map(x => x.toJSON());
        });
    }

    static findByProjectId (projectId, options = {}) {
        return db.transaction({transaction: options.transaction}, async transaction => {
            const members = await db.Member.findAll({where: {projectId}, transaction});
            const res = [];
            for (let member of members) {
                const workTimes = await db.MemberWorkTime.findAll(_.assign({where: {memberId: member.id}}, options, {transaction}));
                workTimes.forEach(workTime => {
                    res.push(_.assign(workTime.toJSON(), {userId: member.userId}));
                });
            }
            return res;
        });
    }

    static create (projectId, userId, iterationId, {promisedMinutes, actualMinutes = 0}, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const member = await db.Member.findOne({where: {projectId, userId}, transaction});
            if (!member) { throw new Error(`member was not found given {projectId: ${projectId}, userId: ${userId}}`); }

            const res = await db.MemberWorkTime.create({
                memberId: member.id,
                projectId,
                iterationId,
                promisedMinutes,
                actualMinutes
            });

            return res.toJSON();
        });
    }

    static updatePromisedWorkTime (projectId, userId, iterationId, promisedMinutes, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const member = await db.Member.findOne({where: {projectId, userId}, transaction});
            if (!member) { throw new Error(`member was not found by {projectId: ${projectId}, userId: ${userId}}`); }

            const memberWorkTime = await db.MemberWorkTime.findOne({
                where: {memberId: member.id, iterationId},
                transaction
            });

            let res;
            if (memberWorkTime) {
                await db.MemberWorkTime.update({promisedMinutes}, {where: {id: memberWorkTime.id}}, transaction);
                res = await db.MemberWorkTime.findOne({where: {id: memberWorkTime.id}}, transaction);
            } else {
                res = await db.MemberWorkTime.create({
                    memberId: member.id,
                    iterationId,
                    promisedMinutes
                }, {transaction});
            }

            return _.assign(res.toJSON(), {userId: member.userId});
        });
    }

    static calcAll (projectId, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const tasks = await db.Task.findAll({
                where: {projectId},
                include: [{model: db.Work, as: 'works', separate: true}],
                transaction
            });
            const works = _.chain(tasks).map(x => x.works || []).flatten().filter(x => x.isEnded).value();

            const members = await db.Member.findAll({where: {projectId}, transaction});
            const iterations = await db.Iteration.findAll({where: {projectId}, transaction});

            const memberWorks = {};
            members.forEach(x => { memberWorks[x.userId] = []; });
            works.forEach(work => memberWorks[work.userId].push(work));

            const actualTimes = [];

            for (let member of members) {
                for (let iteration of iterations) {
                    const works = memberWorks[member.userId];
                    const time = MemberWorkTime._calcOneIterationWorkTime(works, iteration.startTime, iteration.endTime);
                    actualTimes.push({memberId: member.id, iterationId: iteration.id, time});
                }
            }

            for (let {memberId, iterationId, time} of actualTimes) {
                const memberWorkTime = await db.MemberWorkTime.findOne({where: {memberId, iterationId}, transaction});

                const actualMinutes = Math.floor(time / 60 / 1000);

                if (memberWorkTime) {
                    await db.MemberWorkTime.update({actualMinutes}, {where: {id: memberWorkTime.id}}, transaction);
                } else {
                    await db.MemberWorkTime.create({
                        memberId,
                        iterationId,
                        promisedMinutes: 0,
                        actualMinutes
                    }, {transaction});
                }
            }

            return actualTimes;
        });
    }

    static _calcOneIterationWorkTime (works, start, end) {
        return works.reduce((sum, work) => {
            const s = Number(new Date(work.startTime));
            const e = Number(new Date(work.endTime));
            const time = MemberWorkTime._calcDuplicationTime(start, end, s, e);
            return sum + time;
        }, 0);
    }

    static _calcDuplicationTime (s1, e1, s2, e2) {
        if (s1 > s2) { return MemberWorkTime._calcDuplicationTime(s2, e2, s1, e1); }
        if (e1 <= s2) { return 0; }
        if (e1 < e2) { return e1 - s2; }
        return e2 - s2;
    }
}

module.exports = MemberWorkTime;

