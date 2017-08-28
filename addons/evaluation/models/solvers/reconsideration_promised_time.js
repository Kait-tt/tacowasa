const SolverAbstract = require('./solver_abstract');

class ReconsiderationPromisedTime extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }

    static get title () {
        return '約束時間の調整';
    }

    static get description () {
        return '約束時間を見直しましょう。';
    }
}

module.exports = ReconsiderationPromisedTime;
