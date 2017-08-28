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
    }

    changeTab(name) {
        $(`a[href="#evaluation-${name}"]`).tab('show');
    }

    get template () { return require('html-loader!./evaluation_modal.html'); }

    get modalName () { return 'evaluation-modal'; }
}

module.exports = EvaluationModal;
