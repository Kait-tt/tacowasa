'use strict';
require('jquery.qrcode');
require('./task_qr.scss');
const caches = {};

class TaskQR {
    static createQR (taskId, {width = 88, height = 88} = {}) {
        if (caches[taskId]) { return caches[taskId]; }

        const $ele = $('<div class="task-qr"></div>');
        $ele.qrcode({width, height, text: String(taskId)});

        const ele = $ele.get(0);
        caches[taskId] = ele;
        return ele;
    }
}

module.exports = TaskQR;
