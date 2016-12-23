'use strict';
const _ = require('lodash');
const rp = require('request-promise');
const co = require('co');
const db = require('../schemas');
const Util = require('../modules/util');

class StagnationTask {
    static findByProjectId (projectId, {transaction} = {}) {
        return db.coTransaction({transaction}, function* () {
            const tasks = yield db.Task.findAll({where: {projectId}, transaction});
            const stagnatTasks = yield db.TaskStats.findAll({where: {taskId: {in: _.map(tasks, 'id')}, isStagnation: true}, transaction});
            return _.map(stagnatTasks, 'taskId');
        });
    }

    static calcAll (projectId, {transaction} = {}) {
        return db.coTransaction({transaction}, function* (transaction) {
            const members = yield db.Member.findAll({where: {projectId}, transaction});
            const memberStats = yield db.MemberStats.findAll({where: {memberId: {in: _.map(members, 'id')}}, transaction});
            const assignedStages = yield db.Stage.findAll({where: {projectId, assigned: true}, transaction});
            const tasks = yield db.Task.findAll({
                where: {projectId},
                include: [
                    {model: db.Cost, as: 'cost'},
                    {model: db.Work, as: 'works', separate: true}
                ],
                transaction
            });
            const oldTaskStats = yield db.TaskStats.findAll({where: {taskId: {in: tasks.map(x => x.id)}}, transaction});

            const newStagnantTasks = [];
            const newNotStagnantTasks = [];
            for (let task of tasks) {
                const taskStats = oldTaskStats.find(x => x.taskId === task.id);

                if (!_.includes(assignedStages.map(x => x.id), task.stageId) || task.cost.value === 0 || !task.userId) {
                    if (taskStats && taskStats.isStagnation) {
                        newNotStagnantTasks.push(task);
                    }
                    continue;
                }

                const member = members.find(x => x.userId === task.userId);
                const stats = memberStats.filter(x => x.memberId === member.id);
                const isStagnation = StagnationTask._isStagnationTask(task, stats);

                if (isStagnation) {
                    if (!taskStats || !taskStats.isStagnation) {
                        newStagnantTasks.push(task);
                    }
                } else {
                    if (taskStats && taskStats.isStagnation) {
                        newNotStagnantTasks.push(task);
                    }
                }
            }

            // update all
            yield db.TaskStats.update({isStagnation: false}, {where: {taskId: {in: newNotStagnantTasks.map(x => x.taskId)}}, transaction});
            for (let {id: taskId} of newStagnantTasks) {
                yield db.TaskStats.upsert({isStagnation: true, taskId}, {field: ['taskId'], transaction});
            }

            // notify
            if (newStagnantTasks.length) {
                yield StagnationTask.notifyStagnation(projectId, newStagnantTasks, {transaction});
            }

            return {newStagnantTasks, newNotStagnantTasks};
        });
    }

    static updateNotifyUrl (projectId, {url}, {transaction} = {}) {
        return co(function* () {
            yield db.ProjectStats.update({notifyUrl: url}, {where: {projectId}, transaction});
            yield StagnationTask.notify(projectId, '停滞タスクのテスト通知です。');
            return yield db.ProjectStats.findOne({where: {projectId}, transaction});
        });
    }

    static notifyStagnation (projectId, newStagnantTasks, {transaction} = {}) {
        return co(function* () {
            const project = yield db.Project.findOne({
                where: {id: projectId},
                include: [{model: db.User, as: 'users'}],
                transaction
            });
            const taskTexts = [];
            for (let task of newStagnantTasks) {
                const user = project.users.find(x => x.id === task.userId);
                const time = Math.floor(Util.calcSumWorkTime(task.works) / 1000 / 60);
                const minutes = time % 60;
                const hour = Math.floor(time / 60);
                const timeStr = hour ? `${hour}時間${minutes}分` : `${minutes}分`;
                const githubTask = yield db.GitHubTask.findOne({where: {taskId: task.id}, transaction});
                if (githubTask) {
                    taskTexts.push(`[${user.username}] (${timeStr}) #${githubTask.number} ${task.title}`);
                } else {
                    taskTexts.push(`[${user.username}] (${timeStr}) ${task.title}`);
                }
            }
            const text = `${project.name} で ${newStagnantTasks.length} 件の新しい停滞タスクが検知されました。
${taskTexts.map(x => '- ' + x).join('\n')}`;
            yield StagnationTask.notify(projectId, text, {transaction});
        });
    }

    static notify (projectId, text, {transaction} = {}) {
        return co(function* () {
            const projectStats = yield db.ProjectStats.findOne({where: {projectId}, transaction});
            if (!projectStats) { return; }
            const {notifyUrl: url} = projectStats;
            if (!url || !url.trim() || !url.startsWith('http')) { return; }

            const opts = {
                method: 'POST',
                uri: url,
                body: { text: text },
                json: true
            };

            return yield rp(opts);
        });
    }

    static _isStagnationTask (task, memberStats) {
        const predict = memberStats.find(x => x.costId === task.costId);
        if (!predict) { return false; }
        const predictHighMinutes = predict.high;

        const sumTimeMinutes = Util.calcSumWorkTime(task.works) / 1000 / 60;

        return sumTimeMinutes > predictHighMinutes;
    }
}

module.exports = StagnationTask;
