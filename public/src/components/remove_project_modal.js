'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class RemoveProjectModal extends EventEmitter2 {
    constructor(opts={}) {
        super(opts);
        this.project = null;
    }

    submit() {
        this.emit('submit', {project: this.project});
    }

    register() {
        ko.components.register('remove-project-modal', {
            viewModel: () => this,
            template: this.template()
        })
    }

    template() {
        return `
<div class="modal fade" id="remove-project-modal" tabindex="-1" role="dialog" aria-labelledby="remove-project-modal-label" aria-hidden="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="remove-project-modal-label">Remove Project</h4>
            </div>
            <form class="form">
                <div class="modal-body">
                    <p class="text-danger">
                        本当に <span data-bind="value: this.project && this.project.name()"></span> を削除しますか？
                    </p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-danger" data-dismiss="modal"
                            data-bind="click: submit">Remove</button>
                </div>
            </form>

        </div>
    </div>
</div>
`;
    }
}

module.exports = RemoveProjectModal;