'use strict';
require('../scss/stagnation_task.scss');
const _ = require('lodash');
const ko = require('knockout');

class StagnationTaskViewModel {
    constructor (stagnantTaskIds) {
        this.stagnantTaskIds = stagnantTaskIds;
    }

    initDecorateTaskCard (taskCardComponent) {
        taskCardComponent.on('load', taskCard => {
            const ele = taskCard.element.getElementsByClassName('task-card')[0];
            const koAttr = ele.getAttribute('data-bind');
            ele.setAttribute('data-bind', `${koAttr}, css: { 'stagnant-task': task.isStagnant }`);

            const taskCardTitleWrap = ele.getElementsByClassName('task-card-title-wrap')[0];
            const cardTitle = taskCardTitleWrap.getElementsByClassName('card-title')[0];
            taskCardTitleWrap.insertBefore(this.createStagnationSign(), cardTitle);
        });
    }

    createStagnationSign () {
        const icon = document.createElement('i');
        icon.classList.add('glyphicon');
        icon.classList.add('glyphicon-fire');

        const span = document.createElement('span');
        span.appendChild(icon);
        span.classList.add('stagnation-sign');
        span.classList.add('text-danger');
        span.setAttribute('data-bind', 'visible: task.isStagnant, tooltip: { placement: \'right\', title: \'タスクが停滞しています。\' }');
        span.style.marginRight = '5px';

        return span;
    }

    initDecorateTask (tasks) {
        tasks().forEach(task => this.decorateTask(task));
        tasks.subscribe(changes => {
            _.filter(changes, {status: 'added'}).forEach(({value: task}) => {
                this.decorateTask(task);
            });
        }, null, 'arrayChange');
    }

    decorateTask (task) {
        if (task.isDecoratedStagnation) { return; }
        task.isDecoratedStagnation = true;

        task.isStagnant = ko.computed(() => _.includes(this.stagnantTaskIds(), task.id()));
    }
}

module.exports = StagnationTaskViewModel;
