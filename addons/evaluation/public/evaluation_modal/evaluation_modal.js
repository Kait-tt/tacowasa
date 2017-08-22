'use strict';
const ko = require('knockout');
const AbstractModalComponent = require('../../../../public/src/components/modals/abstract_modal_component');

class EvaluationModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions} = {}) {
        super(eventEmitterOptions);
    }

    changeTab(name) {
        $(`a[href="#evaluation-${name}"]`).tab('show');
    }

    get template () { return require('html-loader!./evaluation_modal.html') }

    get modalName () { return 'evaluation-modal'; }
}

module.exports = EvaluationModal;
