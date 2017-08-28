const SolverAbstract = require('./solver_abstract');

class TaskDesign extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }
}

module.exports = TaskDesign;
