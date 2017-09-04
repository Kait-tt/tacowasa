'use strict';
const ko = require('knockout');
const AbstractModalComponent = require('../../../../public/src/components/modals/abstract_modal_component');
const sortBy = require('lodash/sortBy');
const _map = require('lodash/map');
const isEqual = require('lodash/isEqual');

class EvaluationModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions} = {}) {
        super(eventEmitterOptions);
        this.problemComponents = ko.observableArray();

        // auto sort problem components
        this.problemComponents.subscribe(components => {
            const xs = sortBy(components, x => [!x.problem.isOccurred(), x.problem.name]);
            if (!isEqual(_map(components, 'problem.name'), _map(xs, 'problem.name'))) {
                this.problemComponents(xs);
            }
        });

        this.solverComponents = ko.observableArray();

        // auto sort solver components
        this.solverComponents.subscribe(components => {
            const xs = sortBy(components, x => [x.solver.isSolved(), x.solver.name]);
            if (!isEqual(_map(components, 'solver.name'), _map(xs, 'solver.name'))) {
                this.solverComponents(xs);
            }
        });

        // counter
        this.problemCount = ko.computed(() => {
            return this.problemComponents().filter(x => x.problem.isOccurred()).length;
        });

        this.solverCount = ko.computed(() => {
            return this.solverComponents().filter(x => !x.solver.isSolved()).length;
        });
    }

    get template () { return require('html-loader!./evaluation_modal.html'); }

    get modalName () { return 'evaluation-modal'; }
}

module.exports = EvaluationModal;
