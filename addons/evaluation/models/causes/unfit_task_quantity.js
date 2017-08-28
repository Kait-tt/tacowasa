const CauseAbstract = require('./cause_abstract');

class UnfitTaskQuantity extends CauseAbstract {
    static get SolverClasses () {
        return [
            require('../solvers/reconsideration_task_quantity')
        ];
    }

    static get title () {
        return '多すぎるタスク';
    }
}

module.exports = UnfitTaskQuantity;
