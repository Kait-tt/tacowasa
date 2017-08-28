const ProblemAbstract = require('./problem_abstract');

class ProjectCompletionPrediction extends ProblemAbstract {
    static get CauseClasses () {
        return [
            require('../causes/unfit_project_period'),
            require('../causes/unfit_promised_time'),
            require('../causes/unfit_task_quantity')
        ];
    }

    static checkProblem () {
        throw new Error('must be implemented');
    }
}

module.exports = ProjectCompletionPrediction;
