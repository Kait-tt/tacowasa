'use strict';
const ko = require('knockout');
const AbstractModalComponent = require('../abstract_modal_component');

class CreateProjectModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions = {}} = {}) {
        super({eventEmitterOptions});
        this.projectName = ko.observable();
    }

    submit () {
        this.emit('submit', {projectName: this.projectName()});
    }

    get template () { return require('html-loader!./create_project_modal.html'); }

    get modalName () { return 'create-project-modal'; }
}

module.exports = CreateProjectModal;
