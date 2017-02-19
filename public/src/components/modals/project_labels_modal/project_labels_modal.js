'use strict';
const AbstractModalComponent = require('../abstract_modal_component');

class ProjectLabelsModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions = {}, project}) {
        super({eventEmitterOptions});
        this.labels = project.labels;
    }

    get template () { return require('html-loader!./project_labels_modal.html'); }

    get modalName () { return 'project-labels-modal'; }
}

module.exports = ProjectLabelsModal;
