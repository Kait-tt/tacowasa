'use strict';
const _ = require('lodash');
const ko = require('knockout');
const moment = require('moment');
const EventEmitter2 = require('eventemitter2');
const Util = require('../../../../public/src/js/modules/util');

class PredictTimeComponent extends EventEmitter2 {
    constructor (users, iterations, workTimes, {eventEmitterOptions} = {}) {
        super(eventEmitterOptions);
        this.users = users;
        this.memberStats = ko.observable([]);
        this.task = ko.observable();
        this.iterations = iterations;
        this.workTimes = workTimes;
    }

    updateMemberStats (memberStats) {
        this.memberStats(memberStats);
    }

    get componentName () {
        return 'predict-time-component';
    }

    getPredict (user, cost) {
        const stats = this.memberStats().find(x => x.userId === user.id() && x.costId === cost.id());
        if (!stats || !stats.mean) {
            return null;
        }

        return stats;
    }

    calcCompleteIteration (predictTime, user) {
        const now = Date.now();
        const iterations = _.sortBy(this.iterations(), x => x.startTime());
        const workTimes = this.workTimes().filter(x => x.userId === user.id());

        let pos = 0;
        while (pos < iterations.length && new Date(iterations[pos].endTime()) < now) ++pos;
        if (pos === iterations.length) { return null; }

        let remain = Number(predictTime);
        let lastIteration = iterations[pos];
        while (pos < iterations.length && remain) {
            const workTime = workTimes.find(x => x.iterationId === iterations[pos].id());
            if (workTime) {
                const remainPromisedTime = Math.max(0, workTime.promisedMinutes - workTime.actualMinutes);
                remain = Math.max(0, remain - remainPromisedTime);
            }
            lastIteration = iterations[pos];
            ++pos;
        }

        return remain ? null : lastIteration;
    }

    register () {
        const that = this;
        ko.components.register(this.componentName, {
            viewModel: function () {
                this.predicts = ko.pureComputed(() => {
                    const users = that.users().filter(x => x.isVisible());
                    const task = that.task();
                    if (!task) { return []; }

                    const predicts = users.map(user => {
                        const stats = that.getPredict(user, task.cost());
                        const username = user.username();

                        if (!stats || !stats.mean) {
                            return {username, mean: 0, predictTimeFormat: '-', completeDateFormat: '-'};
                        }

                        ['low', 'high', 'mean'].forEach(x => { stats[x] = Math.max(0, stats[x]); });

                        const predictTimeFormat = [stats.low, stats.high]
                            .map(x => Math.max(0, x))
                            .map(Util.minutesFormatHM)
                            .join('～');

                        const completeIteration = [stats.low, stats.high]
                            .map(x => that.calcCompleteIteration(x, user));

                        const completeDateFormat = [
                            completeIteration[0] ? completeIteration[0].startTime() : null,
                            completeIteration[1] ? completeIteration[1].endTime() : null
                        ].map(x => x ? Math.max(Date.now(), new Date(x)) : null)
                            .map(x => x ? moment(x).format('MM/DD(ddd)') : '?').join('～');

                        return {username, mean: stats.mean, predictTimeFormat, completeDateFormat};
                    });

                    return _.sortBy(predicts, 'mean');
                });
            },
            template: require('html!./predict_time_component.html')
        });
    }
}

module.exports = PredictTimeComponent;
