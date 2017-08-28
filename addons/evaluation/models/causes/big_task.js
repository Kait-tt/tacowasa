const CauseAbstract = require('./cause_abstract');

class BigTask extends CauseAbstract {
    static get SolverClasses () {
        return [
            require('../solvers/task_design')
        ];
    }

    static get title () {
        return '巨大なタスク';
    }
}

module.exports = BigTask;
