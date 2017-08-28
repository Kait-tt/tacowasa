'use strict';
const ko = require('knockout');
const Problem = require('./models/problem');
const Cause = require('./models/cause');
const Solver = require('./models/solver');
const EvaluationModalButton = require('./evaluation_modal_button');
const EvaluationModal = require('./evaluation_modal');
const ProblemPanels = require('./problem_panels');

module.exports = {
    init: (kanban, {alert}) => {
        const socket = kanban.socket;

        const problems = ko.observableArray();
        const causes = ko.observableArray();
        const solvers = ko.observableArray();

        // create evaluation modal
        const evaluationModal = new EvaluationModal();
        evaluationModal.register();
        document.body.appendChild(document.createElement(evaluationModal.modalName));

        // create evaluation modal button
        const toolbarButtons = document.getElementById('toolbar-btn-group');
        if (!toolbarButtons) { throw new Error('#toolbar-btn-group was not found'); }

        const evaluationModalButton = new EvaluationModalButton();
        evaluationModalButton.register();
        toolbarButtons.appendChild(document.createElement(evaluationModalButton.componentName));

        // init socket events

        socket.on('evaluation', evaluation => {
            console.log(evaluation); // TODO: remove
            const res = createEvaluation(evaluation);
            problems(res.problems);
            causes(res.causes);
            solvers(res.solvers);

            const problemComponents = createProblemPanels(problems);
            problemComponents.forEach(component => component.register());
            evaluationModal.problemComponents(problemComponents);
        });

        socket.on('initJoinedUsernames', () => { // init
            socket.emit('fetchEvaluation');
        });

        // test // TODO: remove
        setTimeout(() => {
            $('#evaluation-modal').modal('show');
        }, 500);
    }
};

function createEvaluation (evaluation) {
    const problems = evaluation.problems.map(params => new Problem(params));
    const causes = evaluation.causes.map(params => new Cause(params));
    const solvers = evaluation.solvers.map(params => new Solver(params));

    problems.map(problem => {
        problem.causes = problem.causes.map(name => causes.find(cause => cause.name === name));
    });

    return {problems, causes, solvers};
}

function createProblemPanels (problems) {
    return problems().map(problem => {
        const Panel = ProblemPanels[problem.name];
        return new Panel({}, problem);
    });
}
