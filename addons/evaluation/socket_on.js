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
        this.startEvaluateInterval(socketProject, user);
    }

    static async solveEvaluationProblem (socketProject, user, {problemName, memo}) {
        await socketProject.logging(user.username, 'solveEvaluationProblem', {problemName});

        const Problem = Evaluator.findProblem(problemName);
        const problem = new Problem({projectId: socketProject.projectId});
        await problem.updateStatus({isOccurred: false, memo});

        this._emitUpdateEvaluation(socketProject, user, {problems: [await problem.serialize()]})
    }

    static async solveEvaluationSolver (socketProject, user, {solverName}) {
        await socketProject.logging(user.username, 'solveEvaluationSolver', {solverName});

        const Solver = Evaluator.findSolver(solverName);
        const solver = new Solver({projectId: socketProject.projectId});
        await solver.updateStatus({isSolved: true});

        this._emitUpdateEvaluation(socketProject, user, {solvers: [await solver.serialize()]})
    }

    static startEvaluateInterval (socketProject, user) {
        this.evaluate(socketProject, user);
        const _id = setInterval(() => {
            if (user.active) {
                this.evaluate(socketProject, user);
            } else {
                clearInterval(_id);
            }
        }, 60 * 1000);
        return _id;
    }

    static evaluate (socketProject, user) {
        (async () => {
            const evaluator = new Evaluator({projectId: socketProject.projectId});
            const changes = await evaluator.evaluate();
            this._emitUpdateEvaluation(socketProject, user, changes);
        })().catch(err => console.error(err));
    }

    static _emitUpdateEvaluation (socketProject, user, {problems = [], causes = [], solvers = []}) {
        socketProject.emits(user, 'updateEvaluation', {
            problems,
            causes,
            solvers
        });
    }
}

module.exports = EvaluationSocketOn;
