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

    static get checkDurationSeconds () {
        return 24 * 60 * 60; // 24 hour
    }

    async _checkProblem () {
        const now = new Date();
        const projectProblem = await this.findOrCreateProjectProblem();
        const _lastSolvedTime = await this.getLastSolvedTime(projectProblem.id);
        const lastSolvedTime = _lastSolvedTime ? new Date(_lastSolvedTime) : null;

        const its = await Iteration.findByProjectId(this.projectId);
        const targetIts = its.filter(it => {
            const endTime = new Date(it.endTime);
            return lastSolvedTime < endTime && endTime <= now;
        });
        const targetItIds = targetIts.map(it => it.id);

        const times = await MemberWorkTime.findByProjectId(this.projectId, {
            include: [{model: db.Iteration, as: 'iteration'}]
        });

        const targetTimes = times.filter(time => targetItIds.includes(time.iterationId));
        targetTimes.forEach(time => {
            time.diffMinutes = time.promisedMinutes - time.actualMinutes;
        });

        const badTimes = targetTimes
            .filter(time => time.diffMinutes >= this.constructor.allowableErrorMinutes);

        const isOccurred = badTimes.length > 0;

        badTimes.forEach(time => {
            time.iteration = targetIts.find(it => it.id === time.iterationId);
        });

        if (isOccurred) {
            await this.updateStatus({
                isOccurred,
                detail: await this._createDetail(badTimes)
            });
            return true;
        } else {
            await this.updateStatus({isOccurred});
            return false;
        }
    }

    async _createDetail (badTimes) {
        const res = [];

        for (let time of badTimes) {
            const user = await db.User.findById(time.userId);
            if (!user) { return; }

            time.user = user;

            res.push(time);
        }

        return res;
    }

    static get allowableErrorMinutes () {
        return 30;
    }
}

module.exports = PromisedTime;
