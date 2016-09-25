'use strict';
const ko = require('knockout');
const Work = require('../../../js/models/work');
const AbstractModalComponent = require('../abstract_modal_component');

class TaskDetailModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions = {}, project}) {
        super({eventEmitterOptions});

        this.costs = project.costs;
        this.labels = project.labels;
        this.users = project.users;

        this.title = ko.observable();
        this.body = ko.observable();
        this.cost = ko.observable();
        this.works = ko.observableArray();

        this.selectedLabels = ko.observableArray();

        this.task = ko.observable();
        this.task.subscribe(task => {
            this.title(task.title());
            this.body(task.body());
            this.cost(task.cost());
            this.works(task.works().map(x => x.clone()));

            this.selectedLabels.removeAll();
            task.labels().map(x => { this.selectedLabels.push(x); });

            this.editWorkHistoryMode('view');
        });

        this.overWipLimit = ko.computed(() => {
            const task = this.task();
            const user = task && task.user();
            const cost = this.cost();

            return task && user && cost && user.willBeOverWipLimit(cost.value - task.cost().value);
        });

        this.canSaveWorkHistory = ko.computed(() => {
            return this.works().every(work => work.isValidStartTime() && work.isValidEndTime());
        });

        this.canUpdate = ko.computed(() => {
            return this.canSaveWorkHistory() && !this.overWipLimit();
        });

        this.editWorkHistoryMode = ko.observable('view');
    }

    editWorkHistory () {
        this.editWorkHistoryMode('edit');
    }

    saveWorkHistory () {
        this.emit('saveWorkHistory', {
            task: this.task(),
            works: this.works()
        });
        this.editWorkHistoryMode('view');
    }

    cancelWorkHistory () {
        this.works(this.task().works().map(x => x.clone()));
        this.editWorkHistoryMode('view');
    }

    removeWork (work) {
        this.works.remove(work);
    }

    addWork () {
        const user = this.task().user;
        const work = new Work({
            isEnded: true,
            startTime: new Date(),
            endTime: new Date(),
            user: user && user()
        });
        this.works.push(work);
    }

    update () {
        if (this.editWorkHistoryMode() === 'edit') {
            this.saveWorkHistory();
        }

        this.emit('update', {
            task: this.task(),
            title: this.title(),
            body: this.body(),
            cost: this.cost(),
            labels: this.selectedLabels()
        });
    }

    get template () { return require('html!./task_detail_modal.html'); }

    get modalName () { return 'task-detail-modal'; }
}

module.exports = TaskDetailModal;
