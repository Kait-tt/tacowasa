'use strict';
const _ = require('lodash');
const ko = require('knockout');
const TaskQR = require('./task_qr');
const ToggleQRButton = require('./toggle_qr_button');

module.exports = {
    init: (kanban) => {
        addToggleQRButton(kanban);
    }
};

function addToggleQRButton (kanban) {
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

    btns.appendChild(document.createElement(toggleQRButton.componentName));
}

function enableQR (kanban) {
    decorateAllQR();
    kanban.taskCard.on('load', decorateQR);
}

function disableQR (kanban) {
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

    const taskCardTitleWraps = ele.getElementsByClassName('task-card-title-wrap');
    if (!taskCardTitleWraps.length) { throw new Error('.taskCardTitleWraps element was not found'); }
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
