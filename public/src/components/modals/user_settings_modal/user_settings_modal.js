'use strict';
const ko = require('knockout');
const AbstractModalComponent = require('../abstract_modal_component');

class UserSettingsModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions = {}} = {}) {
        super({eventEmitterOptions});
        this.user = ko.observable();

        this.wipLimit = ko.observable(0);
        this.user.subscribe(user => {
            this.wipLimit(user.wipLimit());
        });

        this.canRemove = ko.pureComputed(() => this.user() && this.user().wip() === 0);
        this.canUpdate = ko.pureComputed(() => this.user() && this.user().wip() <= this.wipLimit());
    }

    remove () {
        this.emit('remove', {user: this.user()});
    }

    update () {
        this.emit('update', {user: this.user(), wipLimit: this.wipLimit()});
    }

    get template () { return require('html!./user_settings_modal.html'); }

    get modalName () { return 'user-settings-modal'; }
}

module.exports = UserSettingsModal;
