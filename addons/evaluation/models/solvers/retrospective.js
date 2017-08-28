const SolverAbstract = require('./solver_abstract');

class Retrospective extends SolverAbstract {
    static checkSolved () {
        throw new Error('must be implemented');
    }
}

module.exports = Retrospective;
