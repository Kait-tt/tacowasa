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
            viewModel: () => ({task}) => {
                'use strict';
                this.task = task;
                this.onClickTaskCard = taskCard.onClickTaskCard.bind(taskCard, task);
                this.onClickWork = taskCard.onClickWork.bind(taskCard, task);
            },
            template: require('html!./task_card.html')
        });


        // knockout sortable option
        ko.bindingHandlers.sortable.options.scroll = false;
        ko.bindingHandlers.sortable.beforeMove = TaskCard.onBeforeMoveDrag;
    }

    static onBeforeMoveDrag(arg) {
        const list = arg.targetParent.parent;
        const task = arg.item;

        if (!(list instanceof DraggableTaskList)) {
            return;
        }

        // 作業中か
        if (task.isWorking()) {
            arg.cancelDrop = true;
            this.emit('workingTaskDropped', arg, task);
        }

        // WIPLimitに達するか
        if (task.user !== list.user) {
            const user = list.user;
            const cost = task.cost();
            if (user.willBeOverWipLimit(cost.value())) {
                arg.cancelDrop = true;
                this.emit('overWIPLimitDropped', arg, user, list);
            }
        }
    }
}


module.exports = TaskCard;