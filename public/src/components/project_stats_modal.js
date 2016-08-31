'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class ProjectStatsModal extends EventEmitter2 {
    constructor({eventEmitterOptions={}, project, stats}) {
        super(eventEmitterOptions);
        this.project = project;
        this.stats = stats;
    }

    register() {
        ko.components.register('project-stats-modal', {
            viewModel: () => this,
            template: this.template()
        })
    }

    template() {
        return `<div class="modal fade" id="project-stats-modal" tabindex="-1" role="dialog" aria-labelledby="project-stats-modal-label" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="project-stats-modal-label">Project Stats</h4>
            </div>
            <div class="modal-body">
                <div class="iteration-member-stats">
                    <h3>1週間ごとメンバーごとの実働時間</h3>
                    <div class="table-responsible">
                        <table class="table">
                            <thead>
                            <tr>
                                <th>iteration/username</th>
                                <!-- ko foreach: project.users -->
                                <!-- ko if: isVisible -->
                                <th data-bind="text: username"></th>
                                <!-- /ko -->
                                <!-- /ko -->
                            </tr>
                            </thead>
                            <tbody>
                            <!-- ko foreach: {data: stats.iterationWorkTime, as: 'stats'} -->
                            <tr>
                                <th data-bind="text: stats.startFormat + ' - ' + stats.endFormat"></th>
                                <!-- ko foreach: {data: $root.users, as: 'user'} -->
                                <!-- ko if: user.visible -->
                                <td data-bind="text: stats.users[user.username()].format"></td>
                                <!-- /ko -->
                                <!-- /ko -->
                            </tr>
                            <!-- /ko -->
                            </tbody>
                        </table>
                    </div>
                </div>
                <hr>
                <div class="label-stats">
                    <h3>ラベルごとの合計実働時間</h3>
                    <div class="table-responsible">
                        <table class="table">
                            <thead>
                            <tr><th>label name</th><th>time</th></tr>
                            </thead>
                            <tbody>
                            <!-- ko foreach: stats.totalTimeLabels -->
                            <tr>
                                <td data-bind="text: name"></td>
                                <td data-bind="text: format"></td>
                            </tr>
                            <!-- /ko -->
                            <tr>
                                <td>(Total)</td>
                                <td data-bind="text: stats.totalTimeFormat"></td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`;
    }
}

module.exports = ProjectStatsModal;