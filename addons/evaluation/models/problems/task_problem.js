const ProblemAbstract = require('./problem_abstract');
const StagnationTask = require('../../../stats/models/stagnation_task');
const Task = require('../../../../lib/models/task');
const Util = require('../../../stats/modules/util');
const db = require('../../schemas');

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

    async _checkProblem () {
        const problemTaskIds = await StagnationTask.findByProjectId(this.projectId);
        const isOccurred = !!problemTaskIds.length;

        if (isOccurred) {
            await this.updateStatus({
                isOccurred: true,
                detail: await this._createDetail(problemTaskIds)
            });
            return true;
        } else {
            await this.updateStatus({isOccurred: false});
            return false;
        }
    }

    async _createDetail (problemTaskIds) {
        const tasks = [];

        for (let taskId of problemTaskIds) {
            const task = await Task.findOne({where: {id: taskId}});
            if (!task) { continue; }

            const githubTask = await db.GitHubTask.findOne({where: {taskId}});
            if (githubTask) {
                task.github = githubTask.toJSON();
            }

            task.workTimeMinute = Math.floor(Util.calcSumWorkTime(task.works) / 1000 / 60);
            tasks.push(task);
        }

        return tasks;
    }
}

module.exports = TaskProblem;
