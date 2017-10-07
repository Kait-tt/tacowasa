const ProblemAbstract = require('./problem_abstract');
const MemberWorkTime = require('../../../stats/models/member_work_time');
const Iteration = require('../../../stats/models/iteration');
const db = require('../../schemas');

class PromisedTime extends ProblemAbstract {
    static get CauseClasses () {
        return [
            require('../causes/invalid_promised_time'),
            require('../causes/fuzzy_work_process')
        ];
    }

    static get title () {
        return '約束作業時間を守る';
    }

    static get goodDescription () {
        return '約束時間は守られています（誤差30分未満)。';
    }

    static get badDescription () {
        return '約束時間が守られていません(誤差30分以上)。';
    }

    async _checkProblem () {
        const it = await this._findLastIteration();
        if (!it) { return false; }

        // 既に解決されていたらskip
        if (await this._isAlreadySolved(it)) { return false; }

        const times = await MemberWorkTime.findByProjectId(this.projectId);
        const isOccurred = times
            .filter(time => time.iterationId === it.id)
            .map(time => time.promisedMinutes - time.actualMinutes)
            .some(diff => diff >= this.constructor.allowableErrorMinutes);

        await this.updateStatus({isOccurred});
        return isOccurred;
    }

    async _isAlreadySolved (it) {
        const projectProblem = await this.findOrCreateProjectProblem();
        const logs = await db.EvaluationProjectProblemLog.findAll({
            where: {
                evaluationProjectProblemId: projectProblem.id
            }
        });
        const itEndTime = new Date(it.endTime);
        return logs
            .filter(log => !log.isOccurred)
            .map(log => new Date(log.createdAt))
            .some(logTime => itEndTime <= logTime);
    }

    async _findLastIteration () {
        const its = await Iteration.findByProjectId(this.projectId);
        if (!its || !its.length) { return null; }

        let res = null;
        const now = new Date();
        for (let it of its) {
            if (new Date(it.endTime) <= now) {
                res = it;
            }
        }

        return res;
    }

    static get allowableErrorMinutes () {
        return 30;
    }
}

module.exports = PromisedTime;