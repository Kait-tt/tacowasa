const SolverAbstract = require('./solver_abstract');

class ReconsiderationTaskQuantity extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }

    static get title () {
        return '全体のタスク量を見なおそう';
    }
}

module.exports = ReconsiderationTaskQuantity;
