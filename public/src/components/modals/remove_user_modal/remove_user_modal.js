'use strict';
const ko = require('knockout');
const AbstractModalComponent = require('../abstract_modal_component');

class RemoveUserModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions = {}}) {
        super({eventEmitterOptions});

        this.user = ko.observable();
    }

    remove () {
        this.emit('remove', {
            user: this.user()
        });
    }

    get template () { return require('html!./remove_user_modal.html'); }

    get modalName () { return 'remove-user-modal'; }
}

module.exports = RemoveUserModal;
