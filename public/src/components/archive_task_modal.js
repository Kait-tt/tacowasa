'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class ArchiveTaskModal extends EventEmitter2 {
    constructor ({eventEmitterOptions = {}}) {
        super(eventEmitterOptions);

        this.task = ko.observable();
    }

    archive () {
        this.emit('archive', {
            task: this.task()
        });
    }

    showModal () {
        $('#archive-task-modal').modal('show');
    }

    register () {
        ko.components.register('archive-task-modal', {
            viewModel: () => this,
            template: this.template()
        });
    }

    template () {
        return `<div class="modal fade" id="archive-task-modal" tabindex="-1" role="dialog" aria-labelledby="archive-task-modal-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="archive-task-modal-label">Archive Task</h4>
            </div>
            <!-- ko if: task -->
            <form class="form">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="title" class="control-label">
                            <span class="glyphicon glyphicon-credit-card" aria-hidden="true"></span> タスクのタイトル
                        </label>
                        <p class="form-control-static" id="title"
                           data-bind="text: task().title"></p>
                    </div>

                    <div class="form-group">
                        <label for="body" class="control-label">
                            <span class="glyphicon glyphicon-align-left" aria-hidden="true"></span> タスクの説明
                        </label>
                        <p class="form-control-static" id="body"
                           data-bind="text: task().body"></p>
                    </div>

                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success" data-dismiss="modal"
                            data-bind="click: archive">Archive</button>
                </div>
            </form>
            <!-- /ko -->
        </div>
    </div>
</div>`;
    }
}

module.exports = ArchiveTaskModal;
