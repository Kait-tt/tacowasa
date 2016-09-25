'use strict';
const ko = require('knockout');
const AbstractModalComponent = require('../abstract_modal_component');

class CreateTaskModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions = {}, project}) {
        super(eventEmitterOptions);

        this.title = ko.observable('');
        this.body = ko.observable('');

        this.stages = ko.computed(() => project.stages().filter(x => !x.assigned()));
        this.stage = ko.observable(project.defaultStage());

        this.costs = project.costs;
        this.cost = ko.observable(project.defaultCost());

        this.labels = project.labels;
        this.selectedLabels = ko.observableArray();
    }

    create () {
        this.emit('create', {
            title: this.title(),
            body: this.body(),
            stage: this.stage(),
            cost: this.cost(),
            labels: this.selectedLabels()
        });
    }

    get template () { return require('html!./create_task_modal.html'); }

    get modalName () { return 'create-task-modal'; }
}

module.exports = CreateTaskModal;
