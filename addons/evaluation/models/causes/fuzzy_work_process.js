const CauseAbstract = require('./cause_abstract');

class FuzzyWorkProcess extends CauseAbstract {
    static get SolverClasses () {
        return [
            require('../solvers/reconsideration_work_process')
        ];
    }

    static get title () {
        return '曖昧な作業手順';
    }
}


module.exports = FuzzyWorkProcess;
