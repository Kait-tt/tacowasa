'use strict';
const _ = require('lodash');
const ko = require('knockout');
const moment = require('moment');
const EventEmitter2 = require('eventemitter2');
const Util = require('../../../../public/src/js/modules/util');
const StatUtil = require('../modules/util');

class PredictTimeComponent extends EventEmitter2 {
    constructor (tasks, users, iterations, workTimes, memberStats, {eventEmitterOptions} = {}) {
        super(eventEmitterOptions);
        this.tasks = tasks;
        this.users = users;
        this.iterations = iterations;
        this.workTimes = workTimes;
        this.memberStats = memberStats;
        this.task = ko.observable();
    }

    get componentName () {
        return 'predict-time-component';
    }

    calcPredictTimeFormat (user, task) {
        const stats = _.find(this.memberStats(), {userId: user.id(), costId: task.cost().id()});
        if (!stats) { return '?～?'; }

        return [stats.low, stats.high]
            .map(x => Math.max(0, x))
            .map(Util.minutesFormatHM)
            .join('～');
    }

    calcCompleteDateFormat (user, task) {
        const its = StatUtil.calcCompleteIterationInterval(
            this.tasks(), this.memberStats(), this.iterations(), this.workTimes(), user, task);

        return [its[0] ? its[0].startTime() : null, its[1] ? its[1].endTime() : null]
            .map(x => x ? Math.max(Date.now(), new Date(x)) : null)
            .map(x => x ? moment(x).format('MM/DD(ddd)') : '?').join('～');
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
                        const stats = _.find(that.memberStats(), {userId: user.id(), costId: task.cost().id()});
                        return {
                            username: user.username(),
                            mean: stats ? stats.mean : 0,
                            predictTimeFormat: that.calcPredictTimeFormat(user, task),
                            completeDateFormat: that.calcCompleteDateFormat(user, task)
                        };
                    });

                    return _.sortBy(predicts, 'mean');
                });
            },
            template: require('html-loader!./predict_time_component.html')
        });
    }
}

module.exports = PredictTimeComponent;
