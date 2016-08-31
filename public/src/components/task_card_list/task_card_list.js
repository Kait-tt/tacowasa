'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');
const DraggableTaskList = require('./draggable_task_list');

class TaskCardList extends EventEmitter2 {
    constructor({eventEmitterOptions={}, project}) {
        super(eventEmitterOptions);
        this.project = project;
    }

    updateTaskStatus({task, stage, user}) {
        this.emit('updateTaskStatus', {task, stage, user});
    }

    updateTaskOrder({task, afterTask}) {
        this.emit('updateTaskOrder', {task, afterTask});
    }

    register() {
        const taskCardList = this;
        const {project} = this.project;
        ko.components.register('task_card_list', {
            viewModel: () => ({stage, user}) => {
                'use strict';
                this.stage = stage;
                this.user = user;
                this.users = project.users;
                this.isDummy = stage.assigned() && !user;
                this.draggableTaskList = this.isDummy && new DraggableTaskList({
                    masterTasks: project.tasks,
                    stage,
                    user
                });
                this.tasks = this.draggableTaskList.tasks;

                this.draggableTaskList.on('updatedStatus', taskCardList.updateTaskStatus.bind(taskCardList));
                this.draggableTaskList.on('updatePriority', taskCardList.updateTaskOrder.bind(taskCardList));
            },
            template: require('html!./task_card_list.html')
        });

        // knockout sortable option
        ko.bindingHandlers.sortable.options.scroll = false;
        ko.bindingHandlers.sortable.beforeMove = TaskCardList.onBeforeMoveDrag;
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


module.exports = TaskCardList;