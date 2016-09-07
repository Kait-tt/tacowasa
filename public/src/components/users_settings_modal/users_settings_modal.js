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
        this.emit('visible', {user, isVisible: user.isVisible()}); // isVisibleは既に反転済み
        return true; // checkboxへ伝搬
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
            template: require('html!./users_settings_modal.html')
        })
    }
}

module.exports = UsersSettingsModal;