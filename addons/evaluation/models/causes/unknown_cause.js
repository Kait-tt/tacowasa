const CauseAbstract = require('./cause_abstract');

class UnknownCause extends CauseAbstract {
    static get SolverClasses () {
        return [
            require('../solvers/retrospective')
        ];
    }

    static get title () {
        return '不明';
    }
}


module.exports = UnknownCause;
