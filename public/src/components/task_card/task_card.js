'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class TaskCard extends EventEmitter2 {
    constructor ({eventEmitterOptions = {}} = {}) {
        super(eventEmitterOptions);
        this._renderedId = {};
    }

    onLoad (vm) {
        this.emit('load', vm);
    }

    onClickTaskCard (task) {
        this.emit('clickTaskCard', {task});
    }

    onClickWork (task, vm, ele) {
        this.emit('clickWork', {task});
        ele.stopPropagation();
        return false;
    }

    register () {
        const taskCard = this;
        ko.components.register('task-card', {
            viewModel: function ({task, element, index}) {
                this.task = task;
                this.element = element;
                this.onClickTaskCard = taskCard.onClickTaskCard.bind(taskCard, task);
                this.onClickWork = taskCard.onClickWork.bind(taskCard, task);

                const id = task.id();
                if (taskCard._renderedId[id]) {
                    this.isInitialized = ko.observable(true);
                } else {
                    taskCard._renderedId[id] = true;
                    const idx = ko.unwrap(index);
                    if (idx < 15) {
                        this.isInitialized = ko.observable(true);
                    } else {
                        this.isInitialized = ko.observable(false);

                        setTimeout(() => {
                            this.isInitialized(true);
                        }, idx * 100);
                    }
                }

                taskCard.onLoad(this);
            },
            template: require('html!./task_card.html')
        });
    }
}


module.exports = TaskCard;
