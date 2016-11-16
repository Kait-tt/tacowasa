'use strict';
const co = require('co');
const AddonSocketOn = require('../addon/socket_on');

class StatsSocketOn extends AddonSocketOn {
    static get throughputIntervalTime () {
        return 5000;
    }

    static get socketEventKeys () {
        return ['fetchThroughput'];
    }

    static fetchThroughput (socketProject, user, params) {
        return co(function* () {
            yield socketProject.logging(user.username, 'throughput');
            StatsSocketOn.startThroughputInterval(socketProject, user);
        });
    }

    static startThroughputInterval (socketProject, user) {
        const _id = setInterval(() => {
            if (user.active) {
                StatsSocketOn.throughput(socketProject, user);
            } else {
                clearInterval(_id);
            }
        }, StatsSocketOn.throughputIntervalTime);
        return _id;
    }

    static throughput (socketProject, user) {
        return co(function* () {
            yield socketProject.logging(user.username, 'throughput');
            user.socket.emit('throughput', {});
        });
    }
}

module.exports = StatsSocketOn;
