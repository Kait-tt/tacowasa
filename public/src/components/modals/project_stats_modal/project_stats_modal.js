'use strict';
const AbstractModalComponent = require('../abstract_modal_component');

class ProjectStatsModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions = {}, project, stats}) {
        super({eventEmitterOptions});
        this.project = project;
        this.stats = stats;

        // 統計モーダルを開いたら統計を計算
        this.on('shownModal', () => {
            this.stats.calcLastTwoWeekWorkTime();
        });
    }

    get template () { return require('html-loader!./project_stats_modal.html'); }

    get modalName () { return 'project-stats-modal'; }
}

module.exports = ProjectStatsModal;
