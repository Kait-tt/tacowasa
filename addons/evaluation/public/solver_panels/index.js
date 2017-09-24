const SolverPanelBase = require('./solver_panel_base');
const kebabCase = require('lodash/kebabCase');

const baseSolvers = [
    'ReconsiderationEstimationMethod',
    'ReconsiderationProjectPeriod',
    'ReconsiderationPromisedTime',
    'ReconsiderationTaskQuantity',
    'ReconsiderationWorkProcess',
    'Retrospective',
    'TaskDesign'
];

const Panels = {};
baseSolvers.forEach(name => {
    Panels[name] = class AnonymousSolverPanel extends SolverPanelBase {
        get componentName () { return `solver-panel-${kebabCase(name)}`; }
    };
});

module.exports = Panels;
