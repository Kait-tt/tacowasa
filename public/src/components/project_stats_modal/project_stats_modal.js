'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class ProjectStatsModal extends EventEmitter2 {
    constructor({eventEmitterOptions = {}, project, stats}) {
        super(eventEmitterOptions);
        this.project = project;
        this.stats = stats;
    }

    register() {
        const that = this;
        ko.components.register('project-stats-modal', {
            viewModel: function () {
                // 統計モーダルを開いたら統計を計算
                $('#project-stats-modal').on('show.bs.modal', () => this.stats.calcIterationWorkTime());
                this.project = that.project;
                this.stats = that.stats;
            },
            template: require('html!./project_stats_modal.html')
        });
    }
}

module.exports = ProjectStatsModal;