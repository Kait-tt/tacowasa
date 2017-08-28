const SolverAbstract = require('./solver_abstract');

class ReconsiderationEstimationMethod extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }
}

module.exports = ReconsiderationEstimationMethod;
