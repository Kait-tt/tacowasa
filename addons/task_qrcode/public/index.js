'use strict';
const _ = require('lodash');
const ko = require('knockout');
const TaskQR = require('./task_qr');
const ToggleQRButton = require('./toggle_qr_button');

const enabledQr = ko.observable(false);

module.exports = {
    init: (kanban) => {
        addToggleQRButton(kanban);
    },
    enabledQr
};

function addToggleQRButton (kanban) {
    const socket = kanban.socket;

    const btns = document.getElementById('toolbar-btn-group');
    if (!btns) { throw new Error('#toolbar-btn-group was not found'); }

    const toggleQRButton = new ToggleQRButton();
    toggleQRButton.on('toggle', ({enabledQR}) => {
        if (enabledQR) {
            enableQR(kanban);
        } else {
            disableQR(kanban);
        }
    });
    toggleQRButton.register();

    let beforeQrHoverTasks = [];
    socket.on('qrHover', ({taskIds}) => {
        beforeQrHoverTasks.forEach(task => {
            if (task && _.isFunction(task.isQRHovered)) {
                task.isQRHovered(false);
            }
        });

        beforeQrHoverTasks = [];

        taskIds.forEach(taskId => {
            const task = kanban.project.getTask({id: taskId});
            if (task && _.isFunction(task.isQRHovered)) {
                task.isQRHovered(true);
            }
            beforeQrHoverTasks.push(task);
        });
    });

    let beforeQrPickTask = null;
    socket.on('qrHover', (taskId) => {
        if (beforeQrPickTask) {
            beforeQrPickTask.isQRPicked(false);
        }

        const task = kanban.project.getTask({id: taskId});
        if (task && _.isFunction(task.isQRHovered)) {
            task.isQRHovered(true);
        }

        beforeQrPickTask = task;
    });


    setInterval(() => {
        const tasks = _.sampleSize(kanban.project.tasks(), 10);
        const taskIds = tasks.map(x => x.id());
        socket.emit('qrHover', {taskIds});
    }, 500);

    setInterval(() => {
        const task = _.sample(kanban.project.tasks());
        socket.emit('qrPick', {taskId: task.id()});
    }, 500);

    btns.appendChild(document.createElement(toggleQRButton.componentName));
}

function enableQR (kanban) {
    enabledQr(true);
    decorateAllQR();
    kanban.taskCard.on('load', decorateQR);
}

function disableQR (kanban) {
    enabledQr(false);
    kanban.taskCard.removeListener('load', decorateQR);
    undecorateAllQR();
}

function decorateAllQR () {
    const taskCardComponents = document.getElementsByClassName('task-card');
    _.each(taskCardComponents, taskCardComponent => {
        const taskCardViewModel = ko.contextFor(taskCardComponent).$component;
        decorateQR(taskCardViewModel);
    });
}

function decorateQR (taskCardViewModel) {
    const task = taskCardViewModel.task;
    const qrCode = TaskQR.createQR(task.id());

    const eles = taskCardViewModel.element.getElementsByClassName('task-card');
    if (!eles.length) { throw new Error('.task-card element was not found'); }
    const ele = eles[0];
    ele.classList.add('have-task-qr');

    if (!task.isQRHovered) {
        task.isQRHovered = ko.observable(false);
    }

    if (!task.isQRPicked) {
        task.isQRPicked = ko.observable(false);
    }

    if (!task.qrState) {
        task.qrState = ko.pureComputed(() => {
            if (!enabledQr()) { return 'none'; }
            if (task.isQRPicked()) { return 'picked'; }
            if (task.isQRHovered()) { return 'hovered'; }
            return 'none';
        });
    }

    task.qrState.subscribe(value => {
        if (value === 'none') {
            ele.classList.remove('task-qr-hovered');
            ele.classList.remove('task-qr-picked');
        }
        if (value === 'hovered') { ele.classList.add('task-qr-hovered'); }
        if (value === 'picked') { ele.classList.add('task-qr-picked'); }
    });

    const taskCardTitleWraps = ele.getElementsByClassName('task-card-title-wrap');
    if (!taskCardTitleWraps.length) { return; }
    const taskCardTitleWrap = taskCardTitleWraps[0];

    ele.insertBefore(qrCode, taskCardTitleWrap);
}

function undecorateAllQR () {
    const qrs = Array.prototype.slice.call(document.getElementsByClassName('task-qr'));
    for (let qr of qrs) {
        if (qr && qr.parentNode) {
            qr.parentNode.removeChild(qr);
        }
    }

    _.forEach(document.getElementsByClassName('task-card'), ele => {
        ele.classList.remove('have-task-qr');
    });
}
