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
            template: this.template()
        })
    }

    template() {
        return `<div class="modal fade" id="project-labels-modal" tabindex="-1" role="dialog" aria-labelledby="project-labels-modal-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="project-labels-modal-label">Project Labels</h4>
            </div>
            <div class="modal-body">
                <ul class="project-labels" data-bind="foreach: labels">
                    <li>
                        <span class="label label-default" data-bind="
                                style: { color: '#' + invertMonoColor(), 'background-color':  '#' + color() },
                                text: name"></span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</div>`;
    }
}

module.exports = ProjectLabelsModal;