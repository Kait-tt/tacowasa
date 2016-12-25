'use strict';
const ko = require('knockout');
const AbstractModalComponent = require('../abstract_modal_component');
const TaskBodyPreview = require('../../task_body_preview');
(new TaskBodyPreview()).register();

class ArchiveTaskModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions = {}} = {}) {
        super({eventEmitterOptions});

        this.task = ko.observable();
    }

    archive () {
        this.emit('archive', {
            task: this.task()
        });
    }

    get template () { return require('html!./archive_task_modal.html'); }

    get modalName () { return 'archive-task-modal'; }
}

module.exports = ArchiveTaskModal;
