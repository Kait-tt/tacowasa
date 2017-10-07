const ProblemPanelBase = require('./problem_panel_base');
const kebabCase = require('lodash/kebabCase');
const TaskProblemPanel = require('./task_problem_panel');
const ProblemPromisedTimePanel = require('./problem_promised_time_panel');

const baseProblems = [
    'PredictionDispersion',
    'ProjectCompletionPrediction'
];

const Panels = {
    TaskProblem: TaskProblemPanel,
    PromisedTime: ProblemPromisedTimePanel
};

baseProblems.forEach(name => {
    Panels[name] = class AnonymousProblemPanel extends ProblemPanelBase {
        get componentName () { return `problem-panel-${kebabCase(name)}`; }
    };
});

module.exports = Panels;
