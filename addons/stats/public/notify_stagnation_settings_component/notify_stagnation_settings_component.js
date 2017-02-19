'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class NotifyStagnationSettingsComponent extends EventEmitter2 {
    constructor ({eventEmitterOptions} = {}) {
        super(eventEmitterOptions);
        this.url = ko.observable();
        this.newUrl = ko.observable();
        this.mode = ko.observable('view');
    }

    get componentName () {
        return 'notify-stagnation-settings-component';
    }

    save () {
        if (this.url() !== this.newUrl()) {
            this.url(this.newUrl().trim() || null);
            this.emit('save', {url: this.url()});
            this.mode('view');
        }
    }

    cancel () {
        this.mode('view');
    }

    edit () {
        this.newUrl(this.url());
        this.mode('edit');
    }

    register () {
        const that = this;
        ko.components.register(this.componentName, {
            viewModel: function () { return that; },
            template: require('html-loader!./notify_stagnation_settings_component.html')
        });
    }
}

module.exports = NotifyStagnationSettingsComponent;
