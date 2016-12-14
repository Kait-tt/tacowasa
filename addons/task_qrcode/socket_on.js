'use strict';
const AddonSocketOn = require('../addon/socket_on');

class TaskQRCodeSocketOn extends AddonSocketOn {
    static get socketEventKeys () {
        return ['qrHover', 'qrPick', 'qrScrollStage', 'qrScrollUser'];
    }

    static qrHover (socketProject, user, {taskId}) {
        socketProject.emits(user, 'qrHover', {taskId});
        return Promise.resolve();
    }

    static qrPick (socketProject, user, {taskId}) {
        socketProject.emits(user, 'qrPick', {taskId});
        return Promise.resolve();
    }

    static qrScrollStage (socketProject, user, {stageId, dy}) {
        socketProject.emits(user, 'qrScrollStage', {stageId, dy});
        return Promise.resolve();
    }

    static qrScrollUser (socketProject, user, {dy}) {
        socketProject.emits(user, 'qrScrollUser', {dy});
        return Promise.resolve();
    }
}

module.exports = TaskQRCodeSocketOn;
