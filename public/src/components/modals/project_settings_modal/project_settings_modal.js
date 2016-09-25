'use strict';
const AbstractModalComponent = require('../abstract_modal_component');

class ProjectSettingsModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions = {}, project}) {
        super({eventEmitterOptions});
        this.project = project;
    }

    get template () { return require('html!./project_settings_modal.html'); }

    get modalName () { return 'project-settings-modal'; }
}

module.exports = ProjectSettingsModal;
