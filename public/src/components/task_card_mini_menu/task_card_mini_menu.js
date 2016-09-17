'use strict';
const _ = require('lodash');
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');
const TaskCardMiniMenuView = require('./task_card_mini_menu_view');

class TaskCardMiniMenu extends EventEmitter2 {
    constructor({eventEmitterOptions={}}={}) {
        super(eventEmitterOptions);
    }

    register() {
        ko.components.register('task-card-mini-menu', {
            viewModel: function (params) {
                this.task = params.task;
                this.element = params.element;

                this.enabledNextStageItem = ko.computed(() => _.includes(['backlog', 'archive'], this.task.stage().name()));
                this.enabledPrevStageItem = ko.computed(() => _.includes(['issue', 'done'], this.task.stage().name()));

                this.onClickTaskDetail = () => {};
                this.onClickTaskNextStage = () => {};
                this.onClickTaskArchive = () => {};
                this.onClickTaskAssign = () => {};
                this.onClickStopWork = () => {};
                this.onClickStartWork = () => {};
                this.onClickTaskPrevStage = () => {};

                this.taskCardMiniMenuView = new TaskCardMiniMenuView(this.element);
            },
            template: require('html!./task_card_mini_menu.html')
        })
    }
}

TaskCardMiniMenu.TaskCardMiniMenuView = TaskCardMiniMenuView;

module.exports = TaskCardMiniMenu;