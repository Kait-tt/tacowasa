'use strict';
const ko = require('knockout');
const AbstractModalComponent = require('../../../../public/src/components/modals/abstract_modal_component');

class EvaluationModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions} = {}, selectedProblem) {
        super(eventEmitterOptions);
        this.selectedProblem = selectedProblem;
        this.memo = ko.observable();
    }

    get template () { return require('html-loader!./solve_problem_modal.html'); }

    get modalName () { return 'solve-problem-modal'; }

    solve () {
        this.emit('solve', {problem: this.selectedProblem(), memo: this.memo()});
        $('#solve-problem-modal').modal('hide');
    }
}

module.exports = EvaluationModal;
