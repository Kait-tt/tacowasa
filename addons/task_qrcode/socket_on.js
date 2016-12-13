'use strict';
const AddonSocketOn = require('../addon/socket_on');

class TaskQRCodeSocketOn extends AddonSocketOn {
    static get socketEventKeys () {
        return ['qrHover', 'qrPick'];
    }

    static qrHover (socketProject, user, {taskIds}) {
        socketProject.emits(user, 'qrHover', {taskIds});
        return Promise.resolve();
    }

    static qrPick (socketProject, user, taskId) {
        socketProject.emits(user, 'qrPick', taskId);
        return Promise.resolve();
    }
}

module.exports = TaskQRCodeSocketOn;
