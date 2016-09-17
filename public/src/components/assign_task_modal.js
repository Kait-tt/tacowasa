'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class AssignTaskModal extends EventEmitter2 {
    constructor({eventEmitterOptions={}, project}) {
        super(eventEmitterOptions);

        this.task = ko.observable();
        this.user = ko.observable();
        this.task.subscribe(task => {
            if (task.user()) {
                this.user(task.user());
            }
        });

        this.canAssignUsers = ko.computed(() => project.users().filter(user => !user.isWipLimited()));
    }

    assign() {
        if (this.task().user() !== this.user()) {
            this.emit('assign', {
                task: this.task(),
                user: this.user()
            });
        }
    }

    canAssign() {
        return this.user();
    }

    showModal() {
        $('#assign-task-modal').modal('show');
    }

    register() {
        ko.components.register('assign-task-modal', {
            viewModel: () => this,
            template: this.template()
        })
    }

    template() {
        return `<div class="modal fade" id="assign-task-modal" tabindex="-1" role="dialog" aria-labelledby="assign-task-modal-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="assign-task-modal-label">Assign Task</h4>
            </div>
            <form class="form">
                <div class="modal-body">
                    <p>タスクをアサインします</p>

                    <div class="form-group">
                        <label for="title" class="control-label">
                            <span class="glyphicon glyphicon-credit-card" aria-hidden="true"></span> タスクのタイトル
                        </label>
                        <p class="form-control-static" id="title" data-bind="text: task() && task().title"></p>
                    </div>

                    <div class="form-group">
                        <label for="body" class="control-label">
                            <span class="glyphicon glyphicon-align-left" aria-hidden="true"></span> タスクの説明
                        </label>
                        <p class="form-control-static" id="body" data-bind="text: task() && task().body"></p>
                    </div>

                    <div class="form-group">
                        <label for="user" class="control-label">
                            <span class="glyphicon glyphicon-user" aria-hidden="true"></span> アサイン対象のユーザ名
                        </label>

                        <select class="form-control" id="user"
                                data-bind="options: canAssignUsers,
                                optionsText: 'username',
                                value: user,
                                optionsCaption: '(no assignee)'" required>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success" data-dismiss="modal"
                            data-bind="click: assign, enabled: canAssign">Assign</button>
                </div>
            </form>

        </div>
    </div>
</div>`;
    }
}

module.exports = AssignTaskModal;