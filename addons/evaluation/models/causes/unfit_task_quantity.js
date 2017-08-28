const CauseAbstract = require('./cause_abstract');

class UnfitTaskQuantity extends CauseAbstract {
    static get SolverClasses () {
        return [
            require('../solvers/reconsideration_task_quantity')
        ];
    }
}

module.exports = UnfitTaskQuantity;
