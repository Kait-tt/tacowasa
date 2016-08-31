'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class ProjectLabelsModal extends EventEmitter2 {
    constructor({eventEmitterOptions={}, project}) {
        super(eventEmitterOptions);
        this.labels = project.labels;
    }

    register() {
        ko.components.register('project-labels-modal', {
            viewModel: () => this,
            template: require('html!./project_labels_modal.html')
        })
    }
}

module.exports = ProjectLabelsModal;