'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class UserSettingsModal extends EventEmitter2 {
    constructor({eventEmitterOptions={}}) {
        super(eventEmitterOptions);
        this.user = ko.observable();

        this.wipLimit = ko.observable(0);
        this.user.subscribe(user => {
            this.wipLimit(user.wipLimit());
        });

        this.canRemove = ko.computed(() => this.user() && this.user().wip() === 0);
        this.canUpdate = ko.computed(() => this.user() && this.user().wip() <= this.wipLimit());
    }

    remove() {
        this.emit('remove', {user: this.user()});
    }

    update() {
        this.emit('update', {user: this.user(), wipLimit: this.wipLimit()})
    }

    register() {
        ko.components.register('user-settings-modal', {
            viewModel: () => this,
            template: this.template()
        })
    }

    template() {
        return `<div class="modal fade" id="user-settings-modal" tabindex="-1" role="dialog" aria-labelledby="user-settings-modal-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="user-settings-modal-label">User settings</h4>
            </div>
            <!-- ko if: user -->
            <form class="form">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="username" class="control-label">
                            <span class="glyphicon glyphicon-blackboard"></span> Name
                        </label>
                        <p class="form-control-static" id="username" data-bind="text: user().username"></p>
                    </div>

                    <div class="form-group">
                        <label for="wip" class="control-label">
                            <span class="glyphicon glyphicon-credit-card" aria-hidden="true"></span> 仕掛タスク数
                        </label>
                        <p class="form-control-static" id="wip">
                            <span data-bind="text: user().wip() + '/' + user().wipLimit()"></span>
                        </p>
                        <p class="alert alert-warning" data-bind="visible: user().wip() >= user().wipLimit()">
                            <span class="glyphicon glyphicon-warning-sign"></span> WIP制限に達しています。
                        </p>
                    </div>

                    <div class="form-group">
                        <label for="wip-limit" class="control-label">
                            <span class="glyphicon glyphicon-credit-card" aria-hidden="true"></span> WIP制限量
                        </label>
                        <input type="number" class="form-control" id="wip-limit" placeholder="WIP Limit" min="0"
                               data-bind="value: wipLimit" required>
                        <p class="alert alert-danger" data-bind="visible: user().wip() > wipLimit()">
                            <span class="glyphicon glyphicon-warning-sign"></span> WIP制限を超過しています
                        </p>
                    </div>

                    <div class="form-group">
                        <button type="button" class="btn btn-danger remove-member-button"
                                data-bind="click: remove, enable: canRemove, attr: { disabled: !canRemove() }">
                            <span class="glyphicon glyphicon-trash" aria-hidden="true"></span> Remove
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success" data-dismiss="modal" data-bind="
                    click: update, enable: canUpdate, attr: { disabled: !canUpdate() }">Update</button>
                </div>
            </form>
            <!-- /ko -->
        </div>
    </div>
</div>`;
    }
}

module.exports = UserSettingsModal;