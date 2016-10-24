'use strict';
const TaskQR = require('./task_qr');

module.exports = {
    init: (kanban, {alert}) => {
        kanban.taskCard.on('load', taskCard => {
            const qrCode = TaskQR.createQR(taskCard.task.id());

            const eles = taskCard.element.getElementsByClassName('task-card');
            if (!eles.length) { throw new Error('.task-card element was not found'); }
            const ele = eles[0];

            const taskCardTitleWraps = ele.getElementsByClassName('task-card-title-wrap');
            if (!taskCardTitleWraps.length) { throw new Error('.taskCardTitleWraps element was not found'); }
            const taskCardTitleWrap = taskCardTitleWraps[0];

            ele.insertBefore(qrCode, taskCardTitleWrap);
        });
    }
};
