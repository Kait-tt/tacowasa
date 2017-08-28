const SolverAbstract = require('./solver_abstract');

class ReconsiderationTaskQuantity extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }

    static get title () {
        return '全体のタスク量の調整';
    }

    static get description () {
        return '全体のタスク量を調整しましょう。';
    }
}

module.exports = ReconsiderationTaskQuantity;
