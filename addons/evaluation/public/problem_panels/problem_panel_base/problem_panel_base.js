'use strict';
const ko = require('knockout');
const EventEmitter = require('eventemitter2');

class ProblemPanelBase extends EventEmitter {
    constructor ({eventEmitterOptions} = {}, problem, selectedEvaluation) {
        super(eventEmitterOptions);
        this.problem = problem;
        this.selectedEvaluation = selectedEvaluation;
        this.detailHtml = ko.observable();
    }

    register () {
        ko.components.register(this.componentName, {
            viewModel: () => {
                return this;
            },
            template: this.template
        });
    }

    get componentName () { }

    get template () {
        return require('html-loader!./problem_panel_base.html');
    }

    goToSolverTab (solver) {
        $('a[href="#evaluation-solver"]').tab('show');
        const query = `.solver-panel[data-solver-name="${solver.name}"]`;
        const $evaluationModal = $('#evaluation-modal');
        $evaluationModal.scrollTop(0);
        const target = $(document.querySelector(query)).offset().top;
        $evaluationModal.scrollTop(target);
    }

    solve () {
        this.selectedEvaluation(this.problem);
    }

    showMemos () {
        this.selectedEvaluation(this.problem);
    }
}

module.exports = ProblemPanelBase;
