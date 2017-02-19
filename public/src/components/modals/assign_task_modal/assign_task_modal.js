'use strict';
const ko = require('knockout');
const AbstractModalComponent = require('../abstract_modal_component');
const TaskBodyPreview = require('../../task_body_preview');
(new TaskBodyPreview()).register();

class AssignTaskModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions = {}, project}) {
        super(eventEmitterOptions);

        this.task = ko.observable();
        this.user = ko.observable();
        this.task.subscribe(task => {
            if (task.user()) {
                this.user(task.user());
            }
        });

        this.canAssignUsers = ko.pureComputed(() => project.users().filter(user => !user.isWipLimited()));

        this.canAssign = ko.pureComputed(() => this.user());
    }

    assign () {
        if (this.task().user() !== this.user()) {
            this.emit('assign', {
                task: this.task(),
                user: this.user()
            });
        }
    }

    get template () { return require('html-loader!./assign_task_modal.html'); }

    get modalName () { return 'assign-task-modal'; }
}

module.exports = AssignTaskModal;
