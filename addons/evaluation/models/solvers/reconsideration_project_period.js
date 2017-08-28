const SolverAbstract = require('./solver_abstract');

class ReconsiderationProjectPeriod extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }
}

module.exports = ReconsiderationProjectPeriod;
