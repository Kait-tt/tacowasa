'use strict';
const ko = require('knockout');
const Problem = require('./models/problem');
const Cause = require('./models/cause');
const Solver = require('./models/solver');
const EvaluationModalButton = require('./evaluation_modal_button');
const EvaluationModal = require('./evaluation_modal');
const ProblemPanels = require('./problem_panels');
const SolverPanels = require('./solver_panels');
const SolveProblemModal = require('./solve_problem_modal');
const SolveSolverModal = require('./solve_solver_modal');
const SolveMemoModal = require('./solve_memo_modal');
const flatten = require('lodash/flatten');
const intersection = require('lodash/intersection');

module.exports = {
    init: (kanban, {alert}) => {
        const socket = kanban.socket;

        const problems = ko.observableArray();
        const causes = ko.observableArray();
        const solvers = ko.observableArray();
        const selectedEvaluation = ko.observable();

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

        // create solve problem modal
        const solveProblemModal = new SolveProblemModal({}, selectedEvaluation);
        solveProblemModal.register();
        document.body.appendChild(document.createElement(solveProblemModal.modalName));
        solveProblemModal.on('solve', ({problem, memo}) => {
            socket.emit('solveEvaluationProblem', {
                problemName: problem.name,
                memo
            });
        });

        // create solve solver modal
        const solveSolverModal = new SolveSolverModal({}, selectedEvaluation);
        solveSolverModal.register();
        document.body.appendChild(document.createElement(solveSolverModal.modalName));
        solveSolverModal.on('solve', ({solver, memo}) => {
            socket.emit('solveEvaluationSolver', {
                solverName: solver.name,
                memo
            });
        });

        // create solve memo modal
        const solveMemoModal = new SolveMemoModal({}, selectedEvaluation);
        solveMemoModal.register();
        document.body.appendChild(document.createElement(solveMemoModal.modalName));

        // init socket events

        socket.once('evaluation', evaluation => {
            const res = createEvaluation(evaluation);
            problems(res.problems);
            causes(res.causes);
            solvers(res.solvers);

            const problemComponents = createProblemPanels(problems, selectedEvaluation);
            problemComponents.forEach(component => {
                component.register();
            });
            evaluationModal.problemComponents(problemComponents);

            const solverComponents = createSolverPanels(solvers, selectedEvaluation);
            solverComponents.forEach(component => {
                component.register();
            });
            evaluationModal.solverComponents(solverComponents);
        });

        socket.on('updateEvaluation', changes => {
            changes.problems.forEach(changedProblem => {
                const problem = problems().find(x => x.name === changedProblem.name);
                ['isOccurred', 'updatedAt', 'logs', 'detail'].forEach(key => {
                    problem[key](changedProblem[key]);
                });
            });

            changes.solvers.forEach(changedSolver => {
                const solver = solvers().find(x => x.name === changedSolver.name);
                ['isSolved', 'updatedAt', 'logs'].forEach(key => {
                    solver[key](changedSolver[key]);
                });
            });
        });

        socket.on('initJoinedUsernames', () => { // init
            socket.emit('fetchEvaluation');
        });

        // test // TODO: remove
        // setTimeout(() => {
        //     $('#evaluation-modal').modal('show');
        // }, 500);
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

function createProblemPanels (problems, selectedEvaluation) {
    return problems().map(problem => {
        const Panel = ProblemPanels[problem.name];
        return new Panel({}, problem, selectedEvaluation);
    });
}

function createSolverPanels (solvers, selectedEvaluation) {
    return solvers().map(solver => {
        const Panel = SolverPanels[solver.name];
        return new Panel({}, solver, selectedEvaluation);
    });
}
