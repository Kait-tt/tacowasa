const SolverAbstract = require('./solver_abstract');

class ReconsiderationWorkProcess extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }

    static get title () {
        return '作業手順の見直し';
    }

    static get description () {
        return '作業手順を見なおして合意を得ましょう。';
    }
}

module.exports = ReconsiderationWorkProcess;
