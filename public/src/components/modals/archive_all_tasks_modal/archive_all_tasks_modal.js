'use strict';
const AbstractModalComponent = require('../abstract_modal_component');

class ArchiveAllTaskModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions = {}} = {}) {
        super({eventEmitterOptions});
    }

    archiveAll () {
        this.emit('archiveAll');
    }

    get template () { return require('html-loader!./archive_all_tasks_modal.html'); }

    get modalName () { return 'archive-all-tasks-modal'; }
}

module.exports = ArchiveAllTaskModal;
