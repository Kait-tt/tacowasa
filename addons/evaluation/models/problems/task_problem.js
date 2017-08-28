const ProblemAbstract = require('./problem_abstract');

class TaskProblem extends ProblemAbstract {
    static get CauseClasses () {
        return [
            require('../causes/big_task'),
            require('../causes/poor_estimation'),
            require('../causes/unknown_cause')
        ];
    }

    static checkProblem () {
        throw new Error('must be implemented');
    }
}

module.exports = TaskProblem;
