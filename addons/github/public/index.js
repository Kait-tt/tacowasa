'use strict';
const ko = require('knockout');

module.exports = {
    init: (kanban) => {
        kanban.project.tasks().forEach(decorateGitHubTaskId);
        kanban.project.tasks.subscribe(decorateGitHubTaskId);
    }
};

function decorateGitHubTaskId(task) {
    const oldDisplayTitle = task.displayTitle;
    task.displayTitle = ko.computed(() => {
        const githubTaskId = task.opts.githubTask ? task.opts.githubTask.number : null;
        const text = oldDisplayTitle();
        return `#${githubTaskId} ${text}`;
    });
}