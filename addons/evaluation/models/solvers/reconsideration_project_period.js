const SolverAbstract = require('./solver_abstract');

class ReconsiderationProjectPeriod extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }

    static get title () {
        return 'プロジェクト期間を見なおそう';
    }
}

module.exports = ReconsiderationProjectPeriod;
