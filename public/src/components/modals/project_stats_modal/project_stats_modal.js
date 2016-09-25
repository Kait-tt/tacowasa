'use strict';
const AbstractModalComponent = require('../abstract_modal_component');

class ProjectStatsModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions = {}, project, stats}) {
        super({eventEmitterOptions});
        this.project = project;
        this.stats = stats;

        this.emit('load', () => {
            // 統計モーダルを開いたら統計を計算
            $('#project-stats-modal').on('show.bs.modal', () => this.stats.calcIterationWorkTime());
        });
    }

    get template () { return require('html!./project_stats_modal.html'); }

    get modalName () { return 'project-stats-modal'; }
}

module.exports = ProjectStatsModal;
