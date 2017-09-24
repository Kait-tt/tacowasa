'use strict';
const moment = require('moment');
const AbstractModalComponent = require('../../../../public/src/components/modals/abstract_modal_component');

class SolveMemoModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions} = {}, selectedEvaluation) {
        super(eventEmitterOptions);
        this.selectedEvaluation = selectedEvaluation;
        this.moment = moment;
    }

    get template () { return require('html-loader!./solve_memo_modal.html'); }

    get modalName () { return 'solve-memo-modal'; }
}

module.exports = SolveMemoModal;
