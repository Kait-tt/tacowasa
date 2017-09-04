const ProblemAbstract = require('./problem_abstract');

class ProjectCompletionPrediction extends ProblemAbstract {
    static get CauseClasses () {
        return [
            require('../causes/unfit_project_period'),
            require('../causes/unfit_promised_time'),
            require('../causes/unfit_task_quantity')
        ];
    }

    static get title () {
        return 'プロジェクトの完了予測';
    }

    static get goodDescription () {
        return 'プロジェクトは期間内に完了しそうです。';
    }

    static get badDescription () {
        return 'プロジェクトは期間内に完了しそうにありません。';
    }

    async checkProblem () {
        // TODO: implement
        await this.updateStatus({isOccurred: true});
    }
}

module.exports = ProjectCompletionPrediction;
