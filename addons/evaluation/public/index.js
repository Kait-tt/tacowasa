'use strict';
const ko = require('knockout');
const Problem = require('./models/problem');
const Cause = require('./models/cause');
const Solver = require('./models/solver');
const EvaluationModalButton = require('./evaluation_modal_button');
const EvaluationModal = require('./evaluation_modal');
const ProblemPanels = require('./problem_panels');
const SolverPanels = require('./solver_panels');
const flatten = require('lodash/flatten');
const intersection = require('lodash/intersection');

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

        socket.once('evaluation', evaluation => {
            const res = createEvaluation(evaluation);
            problems(res.problems);
            causes(res.causes);
            solvers(res.solvers);

            const problemComponents = createProblemPanels(problems);
            problemComponents.forEach(component => {
                component.register();
                component.on('solve', () => {
                    socket.emit('solveEvaluationProblem', {
                        problemName: component.problem.name
                    });
                });
            });
            evaluationModal.problemComponents(problemComponents);

            const solverComponents = createSolverPanels(solvers);
            solverComponents.forEach(component => {
                component.register();
                component.on('solve', () => {
                    socket.emit('solveEvaluationSolver', {
                        solverName: component.solver.name
                    });
                });
            });
            evaluationModal.solverComponents(solverComponents);
        });

        socket.on('updateEvaluation', changes => {
            changes.problems.forEach(changedProblem => {
                const problem = problems().find(x => x.name === changedProblem.name);
                ['isOccurred'].forEach(key => {
                    problem[key](changedProblem[key]);
                });
            });

            changes.solvers.forEach(changedSolver => {
                const solver = solvers().find(x => x.name === changedSolver.name);
                ['isSolved'].forEach(key => {
                    solver[key](changedSolver[key]);
                });
            });
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
    const solvers = evaluation.solvers.map(params => new Solver(params));

    const causes = evaluation.causes.map(params => {
        params.solvers = params.solvers.map(name => solvers.find(solver => solver.name === name));
        return new Cause(params);
    });

    const problems = evaluation.problems.map(params => {
        params.causes = params.causes.map(name => causes.find(cause => cause.name === name));
        return new Problem(params);
    });

    solvers.forEach(solver => {
        const relatedCauses = causes.filter(cause => cause.solvers().includes(solver));
        solver.relatedProblems(flatten(problems.filter(problem => intersection(problem.causes(), relatedCauses).length)));
    });

    return {problems, causes, solvers};
}

function createProblemPanels (problems) {
    return problems().map(problem => {
        const Panel = ProblemPanels[problem.name];
        return new Panel({}, problem);
    });
}

function createSolverPanels (solvers) {
    return solvers().map(solver => {
        const Panel = SolverPanels[solver.name];
        return new Panel({}, solver);
    });
}
