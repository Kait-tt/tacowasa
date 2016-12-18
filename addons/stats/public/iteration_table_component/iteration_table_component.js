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
        this.memoMemberWorkTime = {};
    }

    createIteration ({startTime, endTime}) {
        this.emit('createIteration', {startTime, endTime});
    }

    updateIteration ({iterationId, startTime, endTime}) {
        this.emit('updateIteration', {iterationId, startTime, endTime});
    }

    removeIteration (id) {
        this.emit('removeIteration', {iterationId: id});
    }

    updatePromisedWorkTime ({userId, iterationId, promisedMinutes}) {
        this.emit('updatePromisedWorkTime', {userId, iterationId, promisedMinutes});
    }

    _dateFormat (minutes) {
        const x = minutes;
        const h = Math.floor(x / 60);
        const m = x % 60;
        return h ? `${h}h${m}m` : `${m}m`;
    }

    getMemberWorkTime (userId, iterationId) {
        const key = userId + '__' + iterationId;
        if (!this.memoMemberWorkTime[key]) {
            this.memoMemberWorkTime[key] = ko.pureComputed(() => _.find(this.memberWorkTimes(), {userId, iterationId}));
        }
        return this.memoMemberWorkTime[key];
    }

    get componentName () {
        return 'iteration-table-component';
    }

    register () {
        const that = this;
        ko.components.register(this.componentName, {
            viewModel: function () {
                this.iterations = ko.pureComputed(() => {
                    return _.chain(that.iterations())
                        .map(it => ({
                            id: it.id,
                            startTime: ko.pureComputed(() => moment(it.startTime()).format('YYYY-MM-DD')),
                            endTime: ko.pureComputed(() => moment(it.endTime()).format('YYYY-MM-DD')),
                            tempStartTime: ko.observable(),
                            tempEndTime: ko.observable(),
                            tempPromisedMinutes: ko.observable(),
                            isEditMode: ko.observable(false),
                            edit: function () {
                                this.tempStartTime(this.startTime());
                                this.tempEndTime(this.endTime());
                                this.tempPromisedMinutes(_.fromPairs(that.users().map(user => {
                                    const memberWorkTime = that.getMemberWorkTime(user.id(), it.id());
                                    return [user.id(), memberWorkTime() ? memberWorkTime().promisedMinutes : 0];
                                })));
                                this.isEditMode(true);
                            },
                            cancelEdit: function () {
                                this.isEditMode(false);
                            },
                            update: function () {
                                if (this.tempStartTime() !== this.startTime() ||
                                    this.tempEndTime() !== this.endTime()) {
                                    that.updateIteration({
                                        iterationId: this.id(),
                                        startTime: this.tempStartTime(),
                                        endTime: this.tempEndTime()
                                    });
                                }

                                _.forEach(this.tempPromisedMinutes(), (promisedMinutes, userId) => {
                                    const memberWorkTime = that.getMemberWorkTime(userId, it.id());
                                    if (memberWorkTime().promisedMinutes !== promisedMinutes) {
                                        that.updatePromisedWorkTime({userId, iterationId: it.id(), promisedMinutes});
                                    }
                                });

                                this.isEditMode(false);
                            },
                            remove: () => that.removeIteration(it.id())
                        }))
                        .sortBy(x => x.startTime())
                        .value();
                });

                const now = moment();
                this.newStartTime = ko.observable(now.format('YYYY-MM-DD'));
                this.newEndTime = ko.observable(now.add(1, 'd').format('YYYY-MM-DD'));

                that.iterations.subscribe(() => {
                    const its = that.iterations();
                    if (!its) { return; }

                    const lastIteration = _.maxBy(its, x => new Date(x.endTime()));
                    const duration = moment(lastIteration.endTime()).diff(lastIteration.startTime(), 'd');

                    const _newStartTime = moment(lastIteration.endTime());
                    const _newEndTime = moment(_newStartTime).clone().add(duration, 'd');
                    this.newStartTime(_newStartTime.format('YYYY-MM-DD'));
                    this.newEndTime(_newEndTime.format('YYYY-MM-DD'));
                });

                this.createIteration = () => {
                    that.createIteration({
                        startTime: this.newStartTime(),
                        endTime: this.newEndTime()
                    });
                };

                this.users = that.users;

                this.actualWorkTime = (userId, iterationId) => {
                    const memberWorkTime = that.getMemberWorkTime(userId, iterationId);
                    return ko.pureComputed(() => memberWorkTime() ? that._dateFormat(memberWorkTime().actualMinutes) : '-');
                };

                this.promisedWorkTime = (userId, iterationId) => {
                    const memberWorkTime = that.getMemberWorkTime(userId, iterationId);
                    return ko.pureComputed(() => memberWorkTime() ? that._dateFormat(memberWorkTime().promisedMinutes) : '-');
                };

                this.background = (userId, iterationId) => {
                    const memberWorkTime = that.getMemberWorkTime(userId, iterationId);
                    if (memberWorkTime) { return ''; }
                    const {actualMinutes: x, promisedMinutes: y} = memberWorkTime();
                    const successColor = '#d3f9cc';
                    const failColor = '#eee';

                    if (y) {
                        const p = Math.floor(x / y * 100);
                        return `linear-gradient(90deg, ${successColor} ${p}%, ${failColor} ${p}%)`;
                    } else if (x) {
                        return successColor;
                    } else {
                        return null;
                    }
                };
            },
            template: require('html!./iteration_table_component.html')
        });
    }
}

module.exports = IterationTableComponent;
