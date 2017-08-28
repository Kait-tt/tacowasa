const SolverAbstract = require('./solver_abstract');

class ReconsiderationTaskQuantity extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }
}

module.exports = ReconsiderationTaskQuantity;
