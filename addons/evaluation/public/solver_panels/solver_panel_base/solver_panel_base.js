'use strict';
const ko = require('knockout');
const EventEmitter = require('eventemitter2');

class SolverPanelBase extends EventEmitter {
    constructor ({eventEmitterOptions} = {}, solver, selectedSolver) {
        super(eventEmitterOptions);
        this.solver = solver;
        this.selectedSolver = selectedSolver;
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
        return require('html-loader!./solver_panel_base.html');
    }

    goToProblemTab () {
        $('a[href="#evaluation-problem"]').tab('show');
    }

    solve () {
        this.selectedSolver(this.solver);
    }
}

module.exports = SolverPanelBase;
