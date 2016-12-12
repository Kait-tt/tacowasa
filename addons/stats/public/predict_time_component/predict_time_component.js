'use strict';
const _ = require('lodash');
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');
const Util = require('../../../../public/src/js/modules/util');

class PredictTimeComponent extends EventEmitter2 {
    constructor (users, {eventEmitterOptions} = {}) {
        super(eventEmitterOptions);
        this.users = users;
        this.memberStats = ko.observable([]);
        this.task = ko.observable();
    }

    updateMemberStats (memberStats) {
        this.memberStats(memberStats);
    }

    get componentName () {
        return 'predict-time-component';
    }

    register () {
        const that = this;
        ko.components.register(this.componentName, {
            viewModel: function () {
                this.predictions = ko.pureComputed(() => {
                    const users = that.users().filter(x => x.isVisible());
                    const memberStats = that.memberStats();
                    const task = that.task();
                    if (!task) { return []; }
                    const costId = task.cost().id();

                    const predicts = users.map(({id: userId, username}) => {
                        const stats = memberStats.find(x => x.userId === userId() && x.costId === costId);
                        if (!stats || !stats.mean) {
                            return {username, requiredTime: 0, requiredTimeFormat: '-'};
                        }

                        const requiredMean = stats.mean;
                        const requiredTimeFormat = [stats.low, stats.high]
                                .map(Util.minutesFormatHM)
                                .join('～');

                        return {username, requiredMean, requiredTimeFormat};
                    });

                    return _.sortBy(predicts, 'requiredMean');
                });
            },
            template: require('html!./predict_time_component.html')
        });
    }
}

module.exports = PredictTimeComponent;
