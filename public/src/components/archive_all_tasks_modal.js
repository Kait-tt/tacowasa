'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class ArchiveAllTaskModal extends EventEmitter2 {
    constructor({eventEmitterOptions={}}) {
        super(eventEmitterOptions);
    }

    archiveAll() {
        this.emit('archiveAll');
    }

    register() {
        ko.components.register('archive-all-tasks-modal', {
            viewModel: () => this,
            template: this.template()
        });
    }

    template() {
        return `<div class="modal fade" id="archive-all-tasks-modal" tabindex="-1" role="dialog" aria-labelledby="archive-all-tasks-modal-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="archive-all-tasks-modal-label">Archive all tasks</h4>
            </div>
            <form class="form">
                <div class="modal-body">
                    <p>DoneステージのすべてのタスクをArchiveしますか？</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success" data-dismiss="modal"
                            data-bind="click: archiveAll">Archive All</button>
                </div>
            </form>

        </div>
    </div>
</div>`;
    }
}

module.exports = ArchiveAllTaskModal;