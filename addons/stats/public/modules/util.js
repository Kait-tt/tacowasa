'use strict';
const _ = require('lodash');

class StatUtil {
    static pickFutureIterations (iterations) {
        const now = Date.now();
        return _.chain(iterations)
            .sortBy(x => x.startTime())
            .dropWhile(it => new Date(it.endTime()) < now)
            .value();
    }

    static calcCompleteIterationInterval (tasks, memberStats, iterations, workTimes, user, task) {
        const stats = _.find(memberStats, {userId: user.id(), costId: task.cost().id()});
        if (!stats || !stats.mean) { return [null, null]; }

        const func = StatUtil.calcCompleteIteration.bind(StatUtil, iterations, workTimes, user);

        const wipSumHighTime = _.chain(tasks)
            .filter(task => task.user() === user)
            .push(task)
            .uniq()
            .map(task => {
                const s = _.find(memberStats, {userId: user.id(), costId: task.cost().id()});
                return s && s.mean ? Math.max(0, s.high - task.allWorkTime()) : 0;
            })
            .sum()
            .value();

        return [func(stats.low), func(wipSumHighTime)];
    }

    static calcCompleteIteration (iterations, workTimes, user, predictTime) {
        const its = StatUtil.pickFutureIterations(iterations);
        const wts = workTimes.filter(x => x.userId === user.id());

        let remain = Number(predictTime);
        for (let it of its) {
            const wt = wts.find(x => x.iterationId === it.id());
            if (wt) {
                const remainPromisedTime = Math.max(0, wt.promisedMinutes - wt.actualMinutes);
                remain = Math.max(0, remain - remainPromisedTime);
            }
            if (!remain) { return it; }
        }

        return null;
    }
}

module.exports = StatUtil;
