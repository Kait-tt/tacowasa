'use strict';
const ko = require('knockout');
const ProblemPanelBase = require('./problem_panel_base');
const { dateFormatHM } = require('../../../../public/src/js/modules/util');

class ProblemPromisedTimePanel extends ProblemPanelBase {
    constructor ({eventEmitterOptions} = {}, problem, selectedEvaluation) {
        super(eventEmitterOptions, problem, selectedEvaluation);

        ko.computed(() => ({
            isOccurred: this.problem.isOccurred(),
            detail: this.problem.detail()
        })).subscribe(() => this.detailHtml(this.createDetailHtml()));

        this.detailHtml(this.createDetailHtml());
    }

    get componentName () { return 'problem-promised-time-panel'; }

    getItemTexts () {
        const isOccurred = this.problem.isOccurred();
        const times = this.problem.detail();

        if (!isOccurred) {
            return [];
        }

        const items = [];

        for (let time of times) {
            const promisedTimeStr = dateFormatHM(time.promisedMinutes * 60 * 1000);
            const actualTimeStr = dateFormatHM(time.actualMinutes * 60 * 1000);
            const diffTimeStr = dateFormatHM(time.diffMinutes * 60 * 1000);
            const username = time.user.username;

            const item = `[${username}] ${diffTimeStr}の不足 (${actualTimeStr} / ${promisedTimeStr})`;

            items.push(item);
        }

        return items;
    }

    createDetailHtml () {
        const items = this.getItemTexts();
        const itemHtmls = items.map(item => {
            return `<li class="evaluation-problem-promised-time-item">${item}</li>`;
        });

        return [
            '<ul class="evaluation-problem-promised-time-list">',
            ...itemHtmls,
            '</ul>'
        ].join('\n');
    }
}

module.exports = ProblemPromisedTimePanel;
