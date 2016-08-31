'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class UserLabel extends EventEmitter2 {
    constructor({eventEmitterOptions={}}={}) {
        super(eventEmitterOptions);
    }

    clickUserSettings({user}) {
        this.emit('clickUserSettings', {user});
    }

    register() {
        const userLabel = this;
        ko.components.register('user-label', {
            viewModel: function({user}) {
                this.user = user;
                this.clickUserSettings = userLabel.clickUserSettings.bind(userLabel, {user});
            },
            template: require('html!./user_label.html')
        });
    }
}


module.exports = UserLabel;