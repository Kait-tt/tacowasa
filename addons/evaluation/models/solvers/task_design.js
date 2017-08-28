const SolverAbstract = require('./solver_abstract');

class TaskDesign extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }

    static get title () {
        return 'タスクの分析・設計';
    }

    static get description () {
        return 'タスクの分析・設計をしましょう。';
    }
}

module.exports = TaskDesign;
