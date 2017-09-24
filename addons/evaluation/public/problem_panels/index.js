const ProblemPanelBase = require('./problem_panel_base');
const kebabCase = require('lodash/kebabCase');

const baseProblems = [
    'PredictionDispersion',
    'ProjectCompletionPrediction',
    'PromisedTime',
    'TaskProblem'
];

const Panels = {};
baseProblems.forEach(name => {
    Panels[name] = class AnonymousProblemPanel extends ProblemPanelBase {
        get componentName () { return `problem-panel-${kebabCase(name)}`; }
    };
});

module.exports = Panels;
