const CauseAbstract = require('./cause_abstract');

class UnfitPromisedTime extends CauseAbstract {
    static get SolverClasses () {
        return [
            require('../solvers/reconsideration_promised_time')
        ];
    }
}

module.exports = UnfitPromisedTime;
