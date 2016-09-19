'use strict';
const ko = require('knockout');

module.exports = {
    init: (kanban) => {
        kanban.project.tasks().forEach(task => decorateGitHubTask(kanban.project, task));
        kanban.project.tasks.subscribe(task => decorateGitHubTask(kanban.project, task));

        kanban.taskCardMiniMenu.on('load', ({viewModel}) => {
            const html = githubLinkItemTemplate();
            $(viewModel.element).find('li').last().before(html);
            viewModel.view.hide();
        });

        kanban.taskDetailModal.on('load', () => {
            const html = githubTaskLinkBlockHtml();
            $('#task-detail-modal').find('.work-history-block').before(html);
        });
    }
};

function decorateGitHubTask(project, task) {
    const oldDisplayTitle = task.displayTitle;
    task.displayTitle = ko.computed(() => {
        const githubTaskId = task.opts.githubTask ? task.opts.githubTask.number : null;
        const text = oldDisplayTitle();
        return `#${githubTaskId} ${text}`;
    });

    task.githubUrl = ko.computed(() => {
        if (!project.opts.githubRepository || !task.opts.githubTask) { return null; }
        const githubTaskId = task.opts.githubTask.number;
        const username = project.opts.githubRepository.username;
        const reponame = project.opts.githubRepository.reponame;
        return `https://github.com/${username}/${reponame}/issues/${githubTaskId}`;
    });
}

function githubLinkItemTemplate() {
    return `
<!-- ko if: task.githubUrl -->
<li>
    <a target="_blank" class="btn btn-sm btn-default" data-bind="attr: {href: task.githubUrl }">
        <span class="glyphicon glyphicon-link" aria-hidden="true"></span>
    </a>
</li>
<!-- /ko -->
`;
}

function githubTaskLinkBlockHtml() {
    return `

<div data-bind="if: task().githubUrl" class="form-group">
    <a target="_blank" data-bind="attr: { href: task().githubUrl }">
        <span class="glyphicon glyphicon-link" aria-hidden="true"></span> GitHub
    </a>
</div>
`
}
