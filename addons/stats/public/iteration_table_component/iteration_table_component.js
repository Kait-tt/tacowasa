'use strict';
const ko = require('knockout');
const moment = require('moment');
const EventEmitter2 = require('eventemitter2');

class IterationTableComponent extends EventEmitter2 {
    constructor (iterations, users, {eventEmitterOptions} = {}) {
        super(eventEmitterOptions);
        this.users = users;
        this.iterations = iterations;
    }

    createIteration ({startTime, endTime}) {
        this.emit('createIteration', {startTime, endTime});
    }

    updateIteration (id, startTime, endTime) {
        this.emit('updateIteration', {iteration: {id, startTime, endTime}});
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
                    return that.iterations().map(it => ({
                        id: it.id,
                        startTime: ko.computed(() => moment(it.startTime()).format('YYYY-MM-DD')),
                        endTime: ko.computed(() => moment(it.endTime()).format('YYYY-MM-DD')),
                        isEditMode: ko.observable(false),
                        startEdit: function () { this.isEditMode(true); },
                        endEdit: function () { this.isEditMode(false); },
                        remove: () => that.removeIteration(it.id())
                    }));
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
