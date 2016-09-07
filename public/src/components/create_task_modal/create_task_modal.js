'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class CreateTaskModal extends EventEmitter2 {
    constructor({eventEmitterOptions={}, project}) {
        super(eventEmitterOptions);

        this.title = ko.observable("");
        this.body = ko.observable("");

        this.stages = ko.computed(() => project.stages().filter(x => !x.assigned()));
        this.stage = ko.observable(project.defaultStage());

        this.costs = project.costs;
        this.cost = ko.observable(project.defaultCost());

        this.labels = project.labels;
        this.selectedLabels = ko.observableArray();
    }

    create() {
        this.emit('create', {
            title: this.title(),
            body: this.body(),
            stage: this.stage(),
            cost: this.cost(),
            labels: this.selectedLabels()
        });
    }

    register() {
        ko.components.register('create-task-modal', {
            viewModel: () => this,
            template: require('html!./create_task_modal.html')
        })
    }
}

module.exports = CreateTaskModal;