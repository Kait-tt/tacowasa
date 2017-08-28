const SolverAbstract = require('./solver_abstract');

class ReconsiderationProjectPeriod extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }

    static get title () {
        return 'プロジェクト期間の調整';
    }

    static get description () {
        return 'プロジェクト期間を調整しましょう。';
    }
}

module.exports = ReconsiderationProjectPeriod;
