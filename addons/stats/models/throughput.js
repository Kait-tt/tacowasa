'use strict';
const _ = require('lodash');
const db = require('../schemas');
const Project = require('../../../lib/models/project');

class Throughput {
    static calcAll (projectId, {transaction} = {}) {
        return db.coTransaction({transaction}, function* () {
            const project = yield Throughput._fetchProject(projectId, {transaction});

            const doneStageIds = project.stages
                .filter(x => _.includes(['done', 'archive'], x.name))
                .map(x => x.id);
            const doneTasks = project.tasks
                .filter(x => x.works.length)
                .filter(x => _.includes(doneStageIds, x.stageId));

            const memberTasks = {};
            project.users.forEach(x => { memberTasks[x.id] = []; });
            doneTasks.forEach(task => {
                const assignees = _.chain(task.works)
                    .filter(x => x.userId)
                    .map(x => x.userId)
                    .uniq()
                    .value();
                if (assignees.length > 1) { return; }
                if (!memberTasks[assignees[0]]) { return; }
                memberTasks[assignees[0]].push(task);
            });

            const memberThroughput = _.toPairs(memberTasks).map(([userId, tasks]) => {
                return {userId: Number(userId), throughput: Throughput._calcMemberThroughput(tasks)};
            });

            for (let {userId, throughput} of memberThroughput) {
                yield Throughput._updateThroughput(projectId, userId, throughput, {transaction});
            }

            return memberThroughput;
        });
    }

    static _calcMemberThroughput (tasks) {
        let sumCost = 0;
        let sumTime = 0;
        tasks.forEach(task => {
            sumCost += task.cost.value;
            sumTime += _.sum(task.works.map(x => Number(new Date(x.endTime) - new Date(x.startTime))));
        });
        sumTime /= 1000 * 60 * 60; // to hour
        return sumTime ? sumCost / sumTime : 0;
    }

    static _updateThroughput (projectId, userId, throughput, {transaction} = {}) {
        return db.coTransaction({transaction}, function* () {
            const member = yield db.Member.findOne({where: {projectId, userId}, transaction});
            yield db.MemberStats.upsert({
                memberId: member.id,
                throughput
            }, {where: {id: member.id}, transaction});
        });
    }

    static _fetchProject (projectId, {transaction} = {}) {
        return Project.findById(projectId, {
            include: [
                {model: db.User, as: 'users'},
                {model: db.Stage, as: 'stages', separate: true},
                {
                    model: db.Task,
                    as: 'tasks',
                    include: [
                        {model: db.Cost, as: 'cost'},
                        {model: db.Work, as: 'works', separate: true}
                    ],
                    separate: true
                }
            ],
            transaction
        });
    }
}

module.exports = Throughput;
