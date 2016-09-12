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

    updateTaskOrder({task, beforeTask}) {
        this.emit('updateTaskOrder', {task, beforeTask});
    }

    register() {
        const taskCardList = this;
        const project = this.project;
        ko.components.register('task-card-list', {
            viewModel: function({stage, user}) {
                this.stage = stage;
                this.user = user;
                this.users = project.users;
                this.showTasks = user || !stage.assigned();
                if (this.showTasks) {
                    this.draggableTaskList = new DraggableTaskList({
                            masterTasks: project.tasks,
                            stage,
                            user
                        });
                    this.tasks = this.draggableTaskList.tasks;

                    this.draggableTaskList.on('updatedStatus', taskCardList.updateTaskStatus.bind(taskCardList));
                    this.draggableTaskList.on('updatedOrder', taskCardList.updateTaskOrder.bind(taskCardList));

                    this.isCollapse = ko.observable(true);
                    this.toggleCollapse = () => this.isCollapse(!this.isCollapse());
                }
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