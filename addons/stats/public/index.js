'use strict';
const ko = require('knockout');
const _ = require('lodash');

module.exports = {
    init: (kanban, {alert}) => {
        const socket = kanban.socket;

        socket.on('stats', req => {
            console.debug('on: stats', req);
        });

        socket.on('initJoinedUsernames', () => { // init
            socket.emit('fetchStats');
        });
    }
};
