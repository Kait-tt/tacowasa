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
        console.log(this.detailHtml());
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

    goToSolverTab () {
        $('a[href="#evaluation-solver"]').tab('show');
    }

    solve () {
        this.selectedEvaluation(this.problem);
    }

    showMemos () {
        this.selectedEvaluation(this.problem);
    }
}

module.exports = ProblemPanelBase;
