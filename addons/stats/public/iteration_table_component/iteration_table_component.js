'use strict';
const _ = require('lodash');
const ko = require('knockout');
const moment = require('moment');
const EventEmitter2 = require('eventemitter2');

class IterationTableComponent extends EventEmitter2 {
    constructor (iterations, users, memberWorkTimes, {eventEmitterOptions} = {}) {
        super(eventEmitterOptions);
        this.users = users;
        this.iterations = iterations;
        this.memberWorkTimes = memberWorkTimes;
    }

    createIteration ({startTime, endTime}) {
        this.emit('createIteration', {startTime, endTime});
    }

    updateIteration (iterationId, startTime, endTime) {
        this.emit('updateIteration', {iterationId, startTime, endTime});
    }

    removeIteration (id) {
        this.emit('removeIteration', {iterationId: id});
    }

    get componentName () {
        return 'iteration-table-component';
    }

    register () {
        const that = this;
        ko.components.register(this.componentName, {
            viewModel: function () {
                this.iterations = ko.computed(() => {
                    return _.chain(that.iterations())
                        .map(it => ({
                            id: it.id,
                            startTime: ko.computed(() => moment(it.startTime()).format('YYYY-MM-DD')),
                            endTime: ko.computed(() => moment(it.endTime()).format('YYYY-MM-DD')),
                            tempStartTime: ko.observable(),
                            tempEndTime: ko.observable(),
                            isEditMode: ko.observable(false),
                            edit: function () {
                                this.isEditMode(true);
                                this.tempStartTime(this.startTime());
                                this.tempEndTime(this.endTime());
                            },
                            cancelEdit: function () {
                                this.isEditMode(false);
                            },
                            update: function () {
                                if (this.tempStartTime() !== this.startTime() ||
                                    this.tempEndTime() !== this.endTime()) {
                                    that.updateIteration(this.id(), this.tempStartTime(), this.tempEndTime());
                                }
                                this.isEditMode(false);
                            },
                            remove: () => that.removeIteration(it.id())
                        }))
                        .sortBy(x => x.startTime())
                        .value();
                });

                const now = moment().format('YYYY-MM-DD');
                this.newStartTime = ko.observable(now);
                this.newEndTime = ko.observable(now);

                this.createIteration = () => {
                    that.createIteration({
                        startTime: this.newStartTime(),
                        endTime: this.newEndTime()
                    });
                };
            },
            template: require('html!./iteration_table_component.html')
        });
    }
}

module.exports = IterationTableComponent;
