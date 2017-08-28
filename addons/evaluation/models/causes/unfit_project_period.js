const CauseAbstract = require('./cause_abstract');

class UnfitProjectPeriod extends CauseAbstract {
    static get SolverClasses () {
        return [
            require('../solvers/reconsideration_project_period')
        ];
    }

    static get title () {
        return '不適切なプロジェクト期間';
    }
}

module.exports = UnfitProjectPeriod;
