'use strict';
const co = require('co');
const config = require('config');
const AddonSocketOn = require('../addon/socket_on');
const ProjectStats = require('./models/project_stats');

class StatsSocketOn extends AddonSocketOn {
    static get statsIntervalTime () {
        return config.get('stats.cacheTime') / 2;
    }

    static get socketEventKeys () {
        return ['fetchStats'];
    }

    static fetchStats (socketProject, user, params) {
        return co(function* () {
            yield socketProject.logging(user.username, 'fetchStats');
            StatsSocketOn.stats(socketProject, user);
            StatsSocketOn.startStatsInterval(socketProject, user);
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

    static stats (socketProject, user) {
        return co(function* () {
            const stats = yield ProjectStats.calcAll(socketProject.projectId);
            user.socket.emit('stats', stats);
        });
    }
}

module.exports = StatsSocketOn;
