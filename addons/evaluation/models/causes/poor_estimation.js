const CauseAbstract = require('./cause_abstract');

class PoorEstimation extends CauseAbstract {
    static get SolverClasses () {
        return [
            require('../solvers/task_design'),
            require('../solvers/reconsideration_estimation_method'),
            require('../solvers/retrospective')
        ];
    }
}

module.exports = PoorEstimation;
