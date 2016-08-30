'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class UsersSettingsModal extends EventEmitter2 {
    constructor({eventEmitterOptions={}, project}) {
        super(eventEmitterOptions);
        this.users = project.users;
        this.addUsername = ko.observable();
    }

    orderUp(user) {
        const users = this.users();
        const idx = users.indexOf(user);
        if (idx !== 0) {
            this.emit('updateOrder', {user, beforeUser: users[idx - 1]});
        }
    }

    orderDown(user) {
        const users = this.users();
        const len = users.length;
        const idx = users.indexOf(user);
        if (idx !== len - 1) {
            this.emit('updateOrder', {user, beforeUser: idx + 2 === len ? null : users[idx + 2]});
        }
    }

    visibleUser(user) {
        this.emit('visible', {user, isVisible: !user.isVisible()});
    }

    addUser() {
        const username = this.addUsername();
        if (username) {
            this.emit('addUser', {username});
        }
    }

    register() {
        ko.components.register('users-settings-modal', {
            viewModel: () => this,
            template: this.template()
        })
    }

    template() {
        return `<div class="modal fade" id="users-settings-modal" tabindex="-1" role="dialog" aria-labelledby="users-settings-modal-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="users-settings-modal-label">Users settings</h4>
            </div>
            <div class="modal-body">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Name</th>
                            <th>WIP</th>
                            <th>Order</th>
                            <th>Visible</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- ko foreach: users -->
                        <tr>
                            <td><img data-bind="attr: { src: avatarUrl }" src="" width="24" height="24"></td>
                            <td data-bind="text: username"></td>
                            <td data-bind="text: wip() + '/' + wipLimit()"></td>
                            <td>
                                <div class="btn-group" role="group">
                                    <button type="button" class="btn btn-xs btn-default" data-bind="click: $root.orderUp">
                                        <span class="glyphicon glyphicon-triangle-top"></span>
                                    </button>
                                    <button type="button" class="btn btn-xs btn-default" data-bind="click: $root.orderDown">
                                        <span class="glyphicon glyphicon-triangle-bottom"></span>
                                    </button>
                                </div>
                            </td>
                            <td>
                                <input type="checkbox" data-bind="checked: isVisible, click: $root.visibleUser" />
                            </td>
                        </tr>
                        <!-- /ko -->
                    </tbody>
                </table>

                <form class="form">
                    <div class="input-group">
                        <input type="text" class="form-control" id="add-username" placeholder="User Name"
                               data-bind="value: addUsername" required>
                        <span class="input-group-btn">
                            <button class="btn btn-default btn-success" type="submit" data-bind="click: addUser">
                                <span class="glyphicon glyphicon-plus" aria-hidden="true"></span>Add
                            </button>
                        </span>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>`;
    }
}

module.exports = UsersSettingsModal;