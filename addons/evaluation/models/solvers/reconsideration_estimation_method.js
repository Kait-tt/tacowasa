const SolverAbstract = require('./solver_abstract');

class ReconsiderationEstimationMethod extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }

    static get title () {
        return '見積り方法を見なおそう';
    }
}

module.exports = ReconsiderationEstimationMethod;
