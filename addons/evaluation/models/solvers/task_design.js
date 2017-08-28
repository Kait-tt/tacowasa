const SolverAbstract = require('./solver_abstract');

class TaskDesign extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }

    static get title () {
        return 'タスクの設計をしよう';
    }
}

module.exports = TaskDesign;
