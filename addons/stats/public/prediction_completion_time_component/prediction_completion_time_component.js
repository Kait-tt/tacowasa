'use strict';
const _ = require('lodash');
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class PredicateCompletionTimeComponent extends EventEmitter2 {
    constructor (users, {eventEmitterOptions} = {}) {
        super(eventEmitterOptions);
        this.users = users;
        this.memberStats = ko.observable([]);
        this.task = ko.observable();
    }

    updateMemberStats (memberStats) {
        this.memberStats(memberStats);
    }

    _formatFromMinutes (minutes) {
        const m = Math.floor(minutes % 60);
        const h = Math.floor(minutes / 60);
        return h ? `${h}時間${m}分` : `${m}分`;
    }

    get componentName () {
        return 'prediction_completion_time_component';
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
                    const taskCost = Number(task.cost().value());

                    const predictions = users.map(({id: userId, username}) => {
                        const stats = memberStats.find(x => x.userId === userId());
                        if (!taskCost || !stats || !stats.throughput) {
                            return {username, requiredTime: 0, requiredTimeFormat: '-'};
                        }

                        const requiredMinutes = taskCost / stats.throughput * 60;
                        const requiredTimeFormat = that._formatFromMinutes(requiredMinutes);

                        return {username, requiredMinutes, requiredTimeFormat};
                    });

                    return _.sortBy(predictions, 'requiredMinutes');
                });
            },
            template: require('html!./prediction_completion_time_component.html')
        });
    }
}

module.exports = PredicateCompletionTimeComponent;
