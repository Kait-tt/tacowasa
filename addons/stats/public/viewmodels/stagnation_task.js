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
        });
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
        task.isStagnant.subscribe(x => console.log(x));
    }
}

module.exports = StagnationTaskViewModel;
