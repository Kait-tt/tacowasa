'use strict';
const ko = require('knockout');
const marked = require('marked');
const Work = require('../../../js/models/work');
const AbstractModalComponent = require('../abstract_modal_component');

marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false
});

class TaskDetailModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions = {}, project}) {
        super({eventEmitterOptions});

        this.costs = project.costs;
        this.labels = project.labels;
        this.users = project.users;

        this.title = ko.observable();
        this.body = ko.observable();
        this.bodyPreview = ko.pureComputed(() => marked(this.body()));
        this.cost = ko.observable();
        this.works = ko.observableArray();

        this.selectedLabels = ko.observableArray();

        this.bodyMode = ko.observable('preview');

        this.task = ko.observable();
        this.task.subscribe(task => {
            this.title(task.title());
            this.body(task.body());
            this.cost(task.cost());
            this.works(task.works().map(x => x.clone()));

            this.selectedLabels.removeAll();
            task.labels().map(x => { this.selectedLabels.push(x); });

            this.editWorkHistoryMode('view');
            this.bodyMode('preview');
        });

        this.overWipLimit = ko.pureComputed(() => {
            const task = this.task();
            const user = task && task.user();
            const cost = this.cost();

            return task && user && cost && user.willBeOverWipLimit(cost.value - task.cost().value);
        });

        this.canSaveWorkHistory = ko.pureComputed(() => {
            return this.works().every(work => work.isValidStartTime() && work.isValidEndTime());
        });

        this.canUpdate = ko.pureComputed(() => {
            return this.canSaveWorkHistory() && !this.overWipLimit();
        });

        this.editWorkHistoryMode = ko.observable('view');
    }

    editBody () {
        this.bodyMode('edit');
    }

    previewBody () {
        this.bodyMode('preview');
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
