const SolverAbstract = require('./solver_abstract');

class ReconsiderationPromisedTime extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }
}

module.exports = ReconsiderationPromisedTime;
