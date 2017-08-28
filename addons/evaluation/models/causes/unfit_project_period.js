const CauseAbstract = require('./cause_abstract');

class UnfitProjectPeriod extends CauseAbstract {
    static get SolverClasses () {
        return [
            require('../solvers/reconsideration_project_period')
        ];
    }
}

module.exports = UnfitProjectPeriod;
