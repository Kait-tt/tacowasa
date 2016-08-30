'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class CreateTaskModal extends EventEmitter2 {
    constructor({eventEmitterOptions={}, project}) {
        super(eventEmitterOptions);

        this.title = ko.observable();
        this.body = ko.observable();

        this.stages = ko.computed(() => project.stages.filter(x => !x.assigned()));
        this.stage = project.defaultStage;

        this.costs = project.costs;
        this.cost = project.defaultCost;

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
            template: this.template()
        })
    }

    template() {
        return `
<div class="modal fade" id="create-task-modal" tabindex="-1" role="dialog" aria-labelledby="create-task-modal-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="create-task-modal-label">Create Task</h4>
            </div>
            <form class="form">
                <div class="modal-body">
                    <p>タスクを作成します。</p>

                    <div class="form-group">
                        <label for="title" class="control-label">
                            <span class="glyphicon glyphicon-credit-card" aria-hidden="true"></span> タイトル
                        </label>
                        <input type="text" class="form-control" id="title" placeholder="Title"
                               data-bind="value: title" required>
                    </div>

                    <div class="form-group">
                        <label for="body" class="control-label">
                            <span class="glyphicon glyphicon-align-left" aria-hidden="true"></span> 説明
                        </label>
                        <textarea class="form-control" rows="15" id="body" placeholder="Body"
                                  data-bind="value: body"></textarea>
                    </div>

                    <div class="form-group">
                        <label for="stage" class="control-label">
                            <span class="glyphicon glyphicon-road" aria-hidden="true"></span> Stage
                        </label>
                        <select id="stage" class="form-control" data-bind="options: stages, optionsText: 'name', value: stage">
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="cost" class="control-label">
                            <span class="glyphicon glyphicon-scissors"></span> Cost
                        </label>
                        <select id="cost" class="form-control" data-bind="options: costs, optionstext: 'name', value: cost">
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="label" class="control-label">
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
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success" data-dismiss="modal"
                            data-bind="click: create">Create</button>
                </div>
            </form>

        </div>
    </div>
</div>
`;
    }
}

module.exports = CreateTaskModal;