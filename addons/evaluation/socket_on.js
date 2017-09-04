'use strict';
const AddonSocketOn = require('../addon/socket_on');
const Evaluator = require('./models/evaluator');

class EvaluationSocketOn extends AddonSocketOn {
    static get socketEventKeys () {
        return ['fetchEvaluation', 'solveEvaluationProblem', 'solveEvaluationSolver'];
    }

    static async fetchEvaluation (socketProject, user) {
        await socketProject.logging(user.username, 'fetchEvaluation');
        const evaluator = new Evaluator({projectId: socketProject.projectId});
        user.socket.emit('evaluation', await evaluator.serialize());
    }

    static async solveEvaluationProblem (socketProject, user, {problemName}) {
        await socketProject.logging(user.username, 'solveEvaluationProblem', {problemName});

        const Problem = Evaluator.findProblem(problemName);
        const problem = new Problem({projectId: socketProject.projectId});
        await problem.updateStatus({isOccurred: false});

        this._emitUpdateEvaluation(user, {problems: [await problem.serialize()]})
    }

    static async solveEvaluationSolver (socketProject, user, {solverName}) {
        await socketProject.logging(user.username, 'solveEvaluationSolver', {solverName});

        const Solver = Evaluator.findSolver(solverName);
        const solver = new Solver({projectId: socketProject.projectId});
        await solver.updateStatus({isSolved: true});

        this._emitUpdateEvaluation(user, {solvers: [await solver.serialize()]})
    }

    static _emitUpdateEvaluation (user, {problems = [], causes = [], solvers = []}) {
        user.socket.emit('updateEvaluation', {
            problems,
            causes,
            solvers
        });
    }
}

module.exports = EvaluationSocketOn;
