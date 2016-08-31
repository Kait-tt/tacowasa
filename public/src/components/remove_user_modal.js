'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class RemoveUserModal extends EventEmitter2 {
    constructor({eventEmitterOptions={}}) {
        super(eventEmitterOptions);

        this.user = ko.observable();
    }

    remove() {
        this.emit('remove', {
            user: this.user()
        });
    }

    register() {
        ko.components.register('remove-user-modal', {
            viewModel: () => this,
            template: this.template()
        })
    }

    template() {
        return `<div class="modal fade" id="remove-user-modal" tabindex="-1" role="dialog" aria-labelledby="remove-user-modal-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="remove-user-modal-label">Remove User</h4>
            </div>
            <form class="form">
                <div class="modal-body">
                    <p>本当にユーザを削除しますか？</p>

                    <!-- ko if: user -->
                    <div class="form-group">
                        <label for="user-settings-name" class="control-label">
                            <span class="glyphicon glyphicon-blackboard"></span> Username
                        </label>
                        <p class="form-control-static" id="project-settings-user" data-bind="text: user().username"></p>
                    </div>
                    <!-- /ko -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success" data-dismiss="modal"
                            data-bind="click: remove">Remove</button>
                </div>
            </form>

        </div>
    </div>
</div>`;
    }
}

module.exports = RemoveUserModal;