const ProblemAbstract = require('./problem_abstract');

class TaskProblem extends ProblemAbstract {
    static get CauseClasses () {
        return [
            require('../causes/big_task'),
            require('../causes/poor_estimation'),
            require('../causes/unknown_cause')
        ];
    }

    static get title () {
        return '問題タスクの発生';
    }

    static get goodDescription () {
        return '問題タスクは発生していません。';
    }

    static get badDescription () {
        return '問題タスクが発生しています。';
    }

    static checkProblem () {
        throw new Error('must be implemented');
    }
}

module.exports = TaskProblem;
