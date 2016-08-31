'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class TaskCard extends EventEmitter2 {
    constructor({eventEmitterOptions={}}={}) {
        super(eventEmitterOptions);
    }

    onClickTaskCard(task) {
        this.emit('clickTaskCard', {task});
    }

    onClickWork(task) {
        this.emit('clickWork', {task});
    }

    register() {
        const taskCard = this;
        ko.components.register('task-card', {
            viewModel: function({task}) {
                'use strict';
                this.task = task;
                this.onClickTaskCard = taskCard.onClickTaskCard.bind(taskCard, task);
                this.onClickWork = taskCard.onClickWork.bind(taskCard, task);
            },
            template: require('html!./task_card.html')
        });
    }
}


module.exports = TaskCard;