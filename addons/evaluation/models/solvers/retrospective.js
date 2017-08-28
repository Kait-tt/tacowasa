const SolverAbstract = require('./solver_abstract');

class Retrospective extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }

    static get title () {
        return '振り返り';
    }

    static get description () {
        return '振り返りをして原因を考えましょう。';
    }
}

module.exports = Retrospective;
