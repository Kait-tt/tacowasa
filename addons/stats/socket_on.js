'use strict';
const co = require('co');
const config = require('config');
const AddonSocketOn = require('../addon/socket_on');
const ProjectStats = require('./models/project_stats');
const Iteration = require('./models/iteration');

class StatsSocketOn extends AddonSocketOn {
    static get statsIntervalTime () {
        return config.get('stats.cacheTime') / 2;
    }

    static get socketEventKeys () {
        return ['fetchStats', 'createIteration', 'removeIteration', 'updateIteration'];
    }

    static fetchStats (socketProject, user) {
        return co(function* () {
            yield socketProject.logging(user.username, 'fetchStats');
            StatsSocketOn.stats(socketProject, user);
            StatsSocketOn.startStatsInterval(socketProject, user);
        });
    }

    static createIteration (socketProject, user, {startTime, endTime}) {
        return co(function* () {
            const iteration = yield Iteration.create(socketProject.projectId, {startTime, endTime});
            yield socketProject.logging(user.username, 'createIteration', {startTime, endTime});
            socketProject.emits(user, 'createIteration', {iteration});
            yield socketProject.notifyText(user, `createIteration: ${startTime} - ${endTime}`);
            yield StatsSocketOn.stats(socketProject, user, {force: true});
        });
    }

    static removeIteration (socketProject, user, {iterationId}) {
        return co(function* () {
            yield Iteration.remove(socketProject.projectId, iterationId);
            yield socketProject.logging(user.username, 'removeIteration', {iterationId});
            socketProject.emits(user, 'removeIteration', {iterationId});
            yield socketProject.notifyText(user, `removeIteration: ${iterationId}`);
        });
    }

    static updateIteration (socketProject, user, {iterationId, startTime, endTime}) {
        return co(function* () {
            const iteration = yield Iteration.update(socketProject.projectId, iterationId, {startTime, endTime});
            yield socketProject.logging(user.username, 'updateIteration', {iterationId, startTime, endTime});
            socketProject.emits(user, 'updateIteration', {iteration});
            yield socketProject.notifyText(user, `updateIteration: ${iterationId}, ${startTime} - ${endTime}`);
            yield StatsSocketOn.stats(socketProject, user, {force: true});
        });
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
        return co(function* () {
            const stats = yield ProjectStats.calcAll(socketProject.projectId, {force});
            user.socket.emit('stats', stats);
        }).catch(err => console.error(err));
    }
}

module.exports = StatsSocketOn;
