'use strict';
const config = require('config');
const moment = require('moment');
const AddonSocketOn = require('../addon/socket_on');
const ProjectStats = require('./models/project_stats');
const Iteration = require('./models/iteration');
const MemberWorkTime = require('./models/member_work_time');
const StagnationTask = require('./models/stagnation_task');
const db = require('./schemas');

class StatsSocketOn extends AddonSocketOn {
    static get statsIntervalTime () {
        return config.get('stats.cacheTime') / 2;
    }

    static get socketEventKeys () {
        return ['fetchStats', 'createIteration', 'removeIteration', 'updateIteration', 'updatePromisedWorkTime',
            'updateNotifyStagnant'];
    }

    static async fetchStats (socketProject, user) {
        await socketProject.logging(user.username, 'fetchStats');
        StatsSocketOn.stats(socketProject, user);
        StatsSocketOn.startStatsInterval(socketProject, user);
    }

    static async createIteration (socketProject, user, {startTime, endTime}) {
        const iteration = await Iteration.create(socketProject.projectId, {startTime, endTime});
        await socketProject.logging(user.username, 'createIteration', {startTime, endTime});
        socketProject.emits(user, 'createIteration', {iteration});
        await socketProject.notifyText(user, `createIteration: ${startTime} - ${endTime}`);
        await StatsSocketOn.stats(socketProject, user, {force: true});
    }

    static async removeIteration (socketProject, user, {iterationId}) {
        await Iteration.remove(socketProject.projectId, iterationId);
        await socketProject.logging(user.username, 'removeIteration', {iterationId});
        socketProject.emits(user, 'removeIteration', {iterationId});
        await socketProject.notifyText(user, `removeIteration: ${iterationId}`);
        await StatsSocketOn.stats(socketProject, user, {force: true});
    }

    static async updateIteration (socketProject, user, {iterationId, startTime, endTime}) {
        const iteration = await Iteration.update(socketProject.projectId, iterationId, {startTime, endTime});
        await socketProject.logging(user.username, 'updateIteration', {iterationId, startTime, endTime});
        socketProject.emits(user, 'updateIteration', {iteration});
        await socketProject.notifyText(user, `updateIteration: ${iterationId}, ${startTime} - ${endTime}`);
        await StatsSocketOn.stats(socketProject, user, {force: true});
    }

    static async updatePromisedWorkTime (socketProject, user, {userId, iterationId, promisedMinutes}) {
        const memberWorkTime = await MemberWorkTime.updatePromisedWorkTime(socketProject.projectId, userId, iterationId, promisedMinutes);
        await socketProject.logging(user.username, 'updatePromisedWorkTime', {userId, iterationId, promisedMinutes});
        socketProject.emits(user, 'updatePromisedWorkTime', {memberWorkTime});
        const iteration = await db.Iteration.findOne({where: {id: iterationId}});
        const start = moment(iteration.startTime).format('YYYY-MM-DD');
        const end = moment(iteration.endTime).format('YYYY-MM-DD');
        await socketProject.notifyText(user, `updatePromisedWorkTime: ${userId}, ${start} - ${end}, ${promisedMinutes}`);
        await StatsSocketOn.stats(socketProject, user, {force: true});
    }

    static async updateNotifyStagnant (socketProject, user, {url}) {
        await socketProject.logging(user.username, 'updateNotifyStagnant', {url});
        socketProject.emits(user, 'updateNotifyStagnant', {url});
        await StagnationTask.updateNotifyUrl(socketProject.projectId, {url});
        await socketProject.notifyText(user, `updateNotifyStagnant: ${url}`);
    }

    static startStatsInterval (socketProject, user) {
        const _id = setInterval(() => {
            if (user.active) {
                StatsSocketOn.stats(socketProject, user);
            } else {
                clearInterval(_id);
            }
        }, StatsSocketOn.statsIntervalTime);
        return _id;
    }

    static stats (socketProject, user, {force = false} = {}) {
        (async () => {
            const stats = await ProjectStats.calcAll(socketProject.projectId, {force});
            user.socket.emit('stats', stats);
        }).catch(err => console.error(err));
    }
}

module.exports = StatsSocketOn;
