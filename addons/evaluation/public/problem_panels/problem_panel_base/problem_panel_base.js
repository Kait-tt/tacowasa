'use strict';
const ko = require('knockout');
const EventEmitter = require('eventemitter2');

class ProblemPanelBase extends EventEmitter {
    constructor ({eventEmitterOptions} = {}, problem) {
        super(eventEmitterOptions);
        this.problem = problem;
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
        this.problem.isOccurred(false);
    }
}

module.exports = ProblemPanelBase;
