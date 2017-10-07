'use strict';
const ko = require('knockout');
const ProblemPanelBase = require('./problem_panel_base');

class TaskProblemPanel extends ProblemPanelBase {
    constructor ({eventEmitterOptions} = {}, problem, selectedEvaluation) {
        super(eventEmitterOptions, problem, selectedEvaluation);

        ko.computed(() => ({
            isOccurred: this.problem.isOccurred(),
            detail: this.problem.detail()
        })).subscribe(() => this.detailHtml(this.createDetailHtml()));

        this.detailHtml(this.createDetailHtml());
    }

    get componentName () { return 'task-problem-panel'; }

    getTaskTexts () {
        const isOccurred = this.problem.isOccurred();
        const tasks = this.problem.detail();

        if (!isOccurred) {
            return [];
        }

        const items = [];

        for (let task of tasks) {
            const time = task.workTimeMinute;
            const minutes = time % 60;
            const hour = Math.floor(time / 60);
            const timeStr = hour ? `${hour}時間${minutes}分` : `${minutes}分`;
            if (task.githubTask) {
                items.push(`[${task.user.username}] (${timeStr}) #${task.githubTask.number} ${task.title}`);
            } else {
                items.push(`[${task.user.username}] (${timeStr}) ${task.title}`);
            }
        }

        return items;
    }

    createDetailHtml () {
        const items = this.getTaskTexts();
        const itemHtmls = items.map(item => {
            return `<li class="evaluation-task-problem-item">${item}</li>`;
        });

        return [
            '<ul class="evaluation-task-problem-list">',
            ...itemHtmls,
            '</ul>'
        ].join('\n');
    }
}

module.exports = TaskProblemPanel;
