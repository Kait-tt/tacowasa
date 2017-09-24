'use strict';
const ko = require('knockout');
const AbstractModalComponent = require('../../../../public/src/components/modals/abstract_modal_component');

class SolveSolverModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions} = {}, selectedSolver) {
        super(eventEmitterOptions);
        this.selectedSolver = selectedSolver;
        this.memo = ko.observable();
    }

    get template () { return require('html-loader!./solve_solver_modal.html'); }

    get modalName () { return 'solve-solver-modal'; }

    solve () {
        this.emit('solve', {solver: this.selectedSolver(), memo: this.memo()});
        $('#solve-solver-modal').modal('hide');
    }
}

module.exports = SolveSolverModal;
