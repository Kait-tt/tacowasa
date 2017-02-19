'use strict';
const AbstractModalComponent = require('../abstract_modal_component');

class RemoveProjectModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions = {}} = {}) {
        super({eventEmitterOptions});
        this.project = null;
    }

    submit () {
        this.emit('submit', {project: this.project});
    }

    get template () { return require('html-loader!./remove_project_modal.html'); }

    get modalName () { return 'remove-project-modal'; }
}

module.exports = RemoveProjectModal;
