'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class ProjectSettingsModal extends EventEmitter2 {
    constructor({eventEmitterOptions={}, project}) {
        super(eventEmitterOptions);
        this.project = project;
    }

    register() {
        ko.components.register('project-settings-modal', {
            viewModel: () => this,
            template: require('html!./project_settings_modal.html')
        })
    }
}

module.exports = ProjectSettingsModal;