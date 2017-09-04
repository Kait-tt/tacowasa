const ProblemAbstract = require('./problem_abstract');
const StagnationTask = require('../../../stats/models/stagnation_task');

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

    async checkProblem () {
        const problemTaskIds = await StagnationTask.findByProjectId(this.projectId);
        await this.updateStatus({isOccurred: !!problemTaskIds.length});
    }
}

module.exports = TaskProblem;
