'use strict';
const ThroughputTableComponent = require('./throughput_table_component');

module.exports = {
    init: (kanban, {alert}) => {
        const socket = kanban.socket;
        const throughputTableComponent = new ThroughputTableComponent(kanban.project.users);
        throughputTableComponent.register();

        socket.on('stats', req => {
            throughputTableComponent.updateThroughputs(req.members);
        });

        socket.on('initJoinedUsernames', () => { // init
            socket.emit('fetchStats');
        });

        kanban.projectStatsModal.on('load', () => {
            const modal = document.getElementById('project-stats-modal');
            const modalBody = modal.getElementsByClassName('modal-body')[0];
            const firstChild = Array.prototype.slice.call(modalBody.childNodes).find(x => x.nodeType === 1);
            const ele = document.createElement(throughputTableComponent.componentName);
            modalBody.insertBefore(ele, firstChild);
        });
    }
};
