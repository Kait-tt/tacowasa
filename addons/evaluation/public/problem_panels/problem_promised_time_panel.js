'use strict';
const ko = require('knockout');
const moment = require('moment');
const ProblemPanelBase = require('./problem_panel_base');
const { dateFormatHM } = require('../../../../public/src/js/modules/util');
const sortBy = require('lodash/sortBy');
const groupBy = require('lodash/groupBy');

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

        console.log(times);

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
        const isOccurred = this.problem.isOccurred();
        let times = this.problem.detail();

        if (!isOccurred || !times.length) {
            return null;
        }

        const res = [];

        const dateFormat = 'MM月DD日';

        const itTimes = sortBy(groupBy(times, 'iterationId'), times => times[0].startTime);

        res.push('<ul class="evaluation-problem-promised-time-list">');

        for (let times of itTimes) {
            const iteration = times[0].iteration;
            const startTime = moment(new Date(iteration.startTime)).format(dateFormat);
            const endTime = moment(new Date(iteration.endTime)).format(dateFormat);
            const text = `${startTime} 〜 ${endTime}`;
            res.push(`<li class="evaluation-problem-promised-time-item">${text}`);
            res.push('<ul class="evaluation-problem-promised-time-sublist">');

            for (let time of times) {
                const promisedTimeStr = dateFormatHM(time.promisedMinutes * 60 * 1000);
                const actualTimeStr = dateFormatHM(time.actualMinutes * 60 * 1000);
                const diffTimeStr = dateFormatHM(time.diffMinutes * 60 * 1000);
                const username = time.user.username;

                const text = `[${username}] ${diffTimeStr}の不足 (${actualTimeStr} / ${promisedTimeStr})`;

                res.push(`<li class="evaluation-problem-promised-time-subitem">${text}</li>`);
            }

            res.push('</ul>');
            res.push('</li>');
        }

        res.push('</ul>');

        return res.join('\n');

    }
}

module.exports = ProblemPromisedTimePanel;
