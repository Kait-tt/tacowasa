const SolverAbstract = require('./solver_abstract');

class Retrospective extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }

    static get title () {
        return '原因を考えて振り返りをしよう';
    }
}

module.exports = Retrospective;
