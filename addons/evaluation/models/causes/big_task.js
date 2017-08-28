const CauseAbstract = require('./cause_abstract');

class BigTask extends CauseAbstract {
    static get SolverClasses () {
        return [
            require('../solvers/task_design')
        ];
    }
}

module.exports = BigTask;
