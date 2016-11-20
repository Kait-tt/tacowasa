'use strict';
const _ = require('lodash');
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class ThroughputTableComponent extends EventEmitter2 {
    constructor (users, {eventEmitterOptions} = {}) {
        super(eventEmitterOptions);
        this.memberStats = ko.observable([]);
        this.users = users;
    }

    updateMemberStats (memberStats) {
        this.memberStats(memberStats);
    }

    get componentName () {
        return 'throughput-table-component';
    }

    register () {
        const that = this;
        ko.components.register(this.componentName, {
            viewModel: function () {
                this.throughputs = ko.pureComputed(() => {
                    const memberStats = that.memberStats();
                    const users = that.users().filter(x => x.isVisible());

                    const throughputs = users.map(({id: userId, username}) => {
                        const stats = memberStats.find(x => x.userId === userId());
                        const throughput = stats && stats.throughput || 0;
                        const throughputFormat = throughput || '-';
                        return {username, throughput, throughputFormat};
                    });

                    return _.sortBy(throughputs, x => -x.throughput);
                });
            },
            template: require('html!./throughput_table_component.html')
        });
    }
}

module.exports = ThroughputTableComponent;
