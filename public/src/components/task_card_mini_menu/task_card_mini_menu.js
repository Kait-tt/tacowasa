'use strict';
const _ = require('lodash');
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');
const TaskCardMiniMenuView = require('./task_card_mini_menu_view');

class TaskCardMiniMenu extends EventEmitter2 {
    constructor ({eventEmitterOptions = {}} = {}) {
        super(eventEmitterOptions);
    }

    onClickTaskDetail (task) {
        this.emit('clickTaskDetail', {task});
    }

    onClickTaskNextStage (task) {
        this.emit('clickTaskNextStage', {task});
    }

    onClickTaskArchive (task) {
        this.emit('clickTaskArchive', {task});
    }

    onClickTaskAssign (task) {
        this.emit('clickTaskAssign', {task});
    }

    onClickTaskPrevStage (task) {
        this.emit('clickTaskPrevStage', {task});
    }

    onLoad (viewModel) {
        this.emit('load', {viewModel});
    }

    register () {
        const taskCardMiniMenu = this;

        ko.components.register('task-card-mini-menu', {
            viewModel: function (params) {
                this.task = params.task;
                this.element = params.element;

                this.enabledNextStageItem = ko.pureComputed(() => !_.includes(['ready', 'archive'], this.task.stage().name()));
                this.enabledPrevStageItem = ko.pureComputed(() => !_.includes(['memo', 'done'], this.task.stage().name()));

                this.onClickTaskDetail = taskCardMiniMenu.onClickTaskDetail.bind(taskCardMiniMenu, this.task);
                this.onClickTaskNextStage = taskCardMiniMenu.onClickTaskNextStage.bind(taskCardMiniMenu, this.task);
                this.onClickTaskArchive = taskCardMiniMenu.onClickTaskArchive.bind(taskCardMiniMenu, this.task);
                this.onClickTaskAssign = taskCardMiniMenu.onClickTaskAssign.bind(taskCardMiniMenu, this.task);
                this.onClickTaskPrevStage = taskCardMiniMenu.onClickTaskPrevStage.bind(taskCardMiniMenu, this.task);

                this.initRendered = ko.observable(false);
                this.initRender = () => { this.initRendered(true); };

                this.view = new TaskCardMiniMenuView(this.element);

                taskCardMiniMenu.onLoad(this);
            },
            template: require('html-loader!./task_card_mini_menu.html')
        });
    }
}

TaskCardMiniMenu.TaskCardMiniMenuView = TaskCardMiniMenuView;

module.exports = TaskCardMiniMenu;
