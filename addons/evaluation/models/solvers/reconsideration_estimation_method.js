const SolverAbstract = require('./solver_abstract');

class ReconsiderationEstimationMethod extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }

    static get title () {
        return '見積り方法の見直し';
    }

    static get description () {
        return '見積り方法を見直しましょう。';
    }
}

module.exports = ReconsiderationEstimationMethod;
