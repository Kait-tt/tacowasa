'use strict';
const ko = require('knockout');
const EventEmitter = require('eventemitter2');

class ProblemPanelBase extends EventEmitter {
    constructor ({eventEmitterOptions} = {}, problem, selectedProblem) {
        super(eventEmitterOptions);
        this.problem = problem;
        this.selectedProblem = selectedProblem;
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

    goToSolverTab () {
        $('a[href="#evaluation-solver"]').tab('show');
    }

    solve () {
        this.selectedProblem(this.problem);
    }
}

module.exports = ProblemPanelBase;
