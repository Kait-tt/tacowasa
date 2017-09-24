const CauseAbstract = require('./cause_abstract');

class InvalidPromisedTime extends CauseAbstract {
    static get SolverClasses () {
        return [
            require('../solvers/reconsideration_promised_time')
        ];
    }

    static get title () {
        return '不適切な約束時間';
    }
}


module.exports = InvalidPromisedTime;
