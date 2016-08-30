'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');
const Work = require('../models/work');

class TaskDetailModal extends EventEmitter2 {
    constructor({eventEmitterOptions={}, project}) {
        super(eventEmitterOptions);

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
            this.works(task.works.map(x => x.clone()));

            this.selectedLabels.removeAll();
            task.labels().map(x => {this.selectedLabels.push(x);});

            this.editWorkHistoryMode('view');
        });

        this.overWipLimit = ko.computed(() => {
            const task = this.task();
            if (!task) { return false; }
            const user = task.user();
            if (!user) { return false; }
            const cost = this.cost();
            if (!cost) { return false; }
            return user.willBeOverWipLimit(cost.value - task.cost().value);
        });

        this.canSaveWorkHistory = ko.computed(() => {
            return this.works().every(work => work.isValidStartTime() && work.isValidEndTime());
        });

        this.canUpdate = ko.computed(() => {
            return this.canSaveWorkHistory() && !this.overWipLimit();
        });

        this.editWorkHistoryMode = ko.observable('view');
    }

    editWorkHistory() {
        this.editWorkHistoryMode('edit');
    }

    saveWorkHistory() {
        this.emit('saveWorkHistory', {
            task: this.task(),
            works: this.works()
        });
        this.editWorkHistoryMode('view');
    }

    cancelWorkHistory() {
        this.works(this.task.works.map(x => x.clone()));
        this.editWorkHistoryMode('view');
    }

    removeWork(work) {
        this.works.remove(work);
    }

    addWork() {
        this.works.push(new Work({
            isEnded: true,
            startTime: new Date(),
            endTime: new Date(),
            user: this.task.user
        }));
    }

    update() {
        if (this.editWorkHistoryMode() === 'edit') {
            this.saveWorkHistory();
        }

        this.emit('update', {
            task: this.task(),
            title: this.title(),
            body: this.body(),
            cost: this.cost(),
            labels: this.selectedLabels()
        })
    }

    register() {
        ko.components.register('archive-all-tasks-modal', {
            viewModel: () => this,
            template: this.template()
        })
    }

    template() {
        return `<div class="modal fade" id="task-detail-modal" tabindex="-1" role="dialog" aria-labelledby="task-detail-modal-label" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="task-detail-modal-label">Task Detail</h4>
            </div>
          <!-- ko if: $root.selectedIssue() -->
            <form class="form">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="title" class="control-label">
                            <span class="glyphicon glyphicon-credit-card" aria-hidden="true"></span> タイトル
                        </label>
                        <div class="all-work-time-wrapper alert alert-info"
                             data-bind="tooltip: { placement:'right', title: '合計作業時間' }">
                            <span class="glyphicon glyphicon-time"></span>
                            <span data-bind="text: task().allWorkTimeFormat"></span>
                        </div>
                        <input type="text" class="form-control" id="title" placeholder="Title" data-bind="value: title">
                    </div>

                    <div class="form-group">
                        <label for="body" class="control-label">
                            <span class="glyphicon glyphicon-align-left" aria-hidden="true"></span> 説明
                        </label>
                        <textarea class="form-control" rows="15" id="body" placeholder="Body" data-bind="value: body"></textarea>
                    </div>

                    <div class="form-group">
                        <label for="stage" class="control-label">
                            <span class="glyphicon glyphicon-road" aria-hidden="true"></span> Stage
                        </label>
                        <p class="form-control-static" id="stage" data-bind="text: stage"></p>
                    </div>

                    <div class="form-group">
                        <label for="user" class="control-label">
                            <span class="glyphicon glyphicon-user" aria-hidden="true"></span> User
                        </label>
                        <p class="form-control-static" id="user"
                           data-bind="text: task().user() ? task().user().username : '(None)'"></p>
                    </div>

                    <div class="form-group costs-wrapper" data-bind="css: { 'has-error': overWipLimit }">
                        <label for="cost" class="control-label">
                            <span class="glyphicon glyphicon-scissors"></span> Cost
                        </label>
                        <select id="cost" class="form-control" data-bind="options: costs, optionstext: 'name', value: cost">
                        </select>
                        <span class="text-danger" data-bind="visible: overWipLimit">WIP制限を超すためコストを変更できません。</span>
                    </div>

                    <div class="form-group">
                        <label for="labels" class="control-label">
                            <span class="glyphicon glyphicon-tags" aria-hidden="true"></span> Labels
                        </label>
                        <select id="label" multiple data-bind="selectPicker: selectedLabels,
                                                               optionsText: 'name',
                                                               selectPickerOptions: {optionsArray: labels}">
                        </select>
                        <ul class="label-view" data-bind="foreach: selectedLabels">
                          <li>
                                  <span class="label label-default" data-bind="
                                          style: { color: '#' + invertMonoColor(), 'background-color':  '#' + color() },
                                          text: name"></span>
                          </li>
                        </ul>
                    </div>

                    <!-- TODO: github -->
                    <!--<div data-bind="if: github && github().url" class="form-group">-->
                        <!--<a target="_blank" data-bind="attr: { href: github().url }">-->
                            <!--<span class="glyphicon glyphicon-link" aria-hidden="true"></span> GitHub-->
                        <!--</a>-->
                    <!--</div>-->
                  
                    <div class="form-group">
                        <label for="works" class="control-label">
                            <span class="glyphicon glyphicon-time"></span> Work History
                            <!-- ko if: editWorkHistoryMode() === 'view' -->
                            <!-- ko if: task().isWorking -->
                            <button class="btn btn-sm edit-work-history btn-primary disabled" data-bind="
                                    tooltip: { placement:'right', title: '作業中は編集できません。' }">
                                <span class="glyphicon glyphicon-edit"></span> Edit
                            </button>
                            <!-- /ko -->
                            <!-- ko ifnot: task().isWorking -->
                            <button class="btn btn-sm edit-work-history btn-primary" data-bind="click: editWorkHistory">
                                <span class="glyphicon glyphicon-edit"></span> Edit
                            </button>
                            <!-- /ko -->
                            <!-- /ko -->
                          
                            <!-- ko if: editWorkHistoryMode() === 'edit' -->
                            <button class="btn btn-sm edit-work-history btn-success"
                                    data-bind="click: saveWorkHistory, enable: canSaveWorkHistory">
                                <span class="glyphicon glyphicon-ok"></span> Save
                            </button>
                            <button class="btn btn-sm edit-work-history btn-danger" data-bind="click: cancelWorkHistory">
                                <span class="glyphicon glyphicon-remove"></span> Cancel
                            </button>
                            <!-- /ko -->
                        </label>
                        <div class="table-responsive" id="works">
                            <table class="table">
                                <!-- ko if: editWorkHistoryMode() === 'view' -->
                                <thead>
                                <tr><th>StartTime</th><th>EndTime</th><th>Duration</th><th>User</th></tr>
                                </thead>
                                <tbody data-bind="foreach: user().works">
                                <tr>
                                    <td data-bind="text: startTimeFormat"></td>
                                    <td data-bind="text: endTimeFormat"></td>
                                    <td data-bind="text: duration"></td>
                                    <td data-bind="text: userName"></td>
                                </tr>
                                </tbody>
                                <!-- /ko -->
                                <!-- ko if: editWorkHistoryMode() === 'edit' -->
                                <thead>
                                <tr><th>StartTime</th><th>EndTime</th><th>Duration</th><th>User</th><th>#</th></tr>
                                </thead>
                                <tbody data-bind="foreach: works">
                                <tr>
                                    <td data-bind="css: { 'has-error': !isValidStartTime() }">
                                        <input type="datetime" class="form-control" data-bind="value: startTimeFormat">
                                    </td>
                                    <td data-bind="css: { 'has-error': !isValidEndTime() }">
                                        <input type="datetime" class="form-control" data-bind="value: endTimeFormat">
                                    </td>
                                    <td data-bind="text: duration"></td>
                                    <td data-bind="css: { 'has-error': !isValidUserId() } ">
                                        <select class="form-control"
                                                data-bind="options: users,
                                                optionsText: 'username',
                                                optionsValue: 'username',
                                                optionsCaption: '(no assignee)'" required>
                                        </select>
                                    </td>
                                    <td>
                                        <a class="remove-work glyphicon glyphicon-trash" role="button" data-bind="click: removeWork"></a>
                                    </td>
                                </tr>
                                </tbody>
                                <!-- /ko -->
                            </table>
                            <!-- ko if: editWorkHistoryMode === 'edit' -->
                            <button class="add-work btn btn-primary" data-bind="click: addWork">
                                <span class="glyphicon glyphicon-plus"></span> Add work
                            </button>
                            <!-- /ko -->
                        </div>
                    </div>
                    <!-- /ko -->
                    <!-- /ko -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success" data-dismiss="modal"
                            data-bind="click: update,
                            enable: canUpdate">Update</button>
                </div>
            </form>
            <!-- /ko -->
        </div>
    </div>
</div>`;
    }
}

module.exports = TaskDetailModal;