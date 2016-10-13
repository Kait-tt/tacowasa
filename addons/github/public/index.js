'use strict';
const ko = require('knockout');
const _ = require('lodash');
const SyncAllFromGitHubComponent = require('./sync_all_from_github_component');

module.exports = {
    init: (kanban, {alert}) => {
        const syncAllComponent = new SyncAllFromGitHubComponent(kanban, kanban.project);
        syncAllComponent.on('completedSyncAllFromGitHub', () => {
            alert.pushAlert({
                title: 'GitHub同期に成功しました',
                message: 'ブラウザを更新してください',
                isSuccess: true
            });
        });
        syncAllComponent.on('failedSyncAllFromGitHub', ({error}) => {
            alert.pushAlert({
                title: 'GitHub同期に失敗しました',
                message: error.message,
                isSuccess: false
            });
        });
        syncAllComponent.initSocket();
        syncAllComponent.register();

        decorateProject(kanban.project);
        kanban.project.tasks().forEach(task => decorateTask(kanban.project, task));
        kanban.project.tasks.subscribe(changes => {
            _.filter(changes, {status: 'added'}).forEach(({value: task}) => {
                decorateTask(kanban.project, task);
            });
        }, null, 'arrayChange');

        kanban.projectSettingsModal.on('load', () => {
            const html = githubRepositoryLinkBlockTemplate();
            $('#project-settings-modal').find('form').append(html);
            $('#project-settings-modal').find('form').append(`<${syncAllComponent.componentName}>`);
        });

        kanban.taskCardMiniMenu.on('load', ({viewModel}) => {
            const html = githubLinkItemTemplate();
            $(viewModel.element).find('li').last().before(html);
        });

        kanban.taskDetailModal.on('load', () => {
            const html = githubTaskLinkBlockTemplate();
            $('#task-detail-modal').find('.work-history-block').before(html);
        });
    }
};

function decorateProject (project) {
    project.githubRepository = project.opts.githubRepository;
    if (project.githubRepository) {
        const repo = project.githubRepository;
        repo.url = `https://github.com/${repo.username}/${repo.reponame}`;
        repo.displayText = `${repo.username}/${repo.reponame}`;
    }
}

function decorateTask (project, task) {
    if (task.isGitHubDecorated) { return; }
    task.isGitHubDecorated = true;

    task.githubNumber = ko.observable(task.opts.githubTask ? task.opts.githubTask.number : null);

    const oldDisplayTitle = task.displayTitle;
    task.displayTitle = ko.computed(() => {
        const githubNumber = task.githubNumber();
        const text = oldDisplayTitle();
        return `#${githubNumber} ${text}`;
    });

    task.githubUrl = ko.computed(() => {
        if (!project.opts.githubRepository || !task.opts.githubTask) { return null; }
        const githubNumber = task.githubNumber();
        const username = project.opts.githubRepository.username;
        const reponame = project.opts.githubRepository.reponame;
        return `https://github.com/${username}/${reponame}/issues/${githubNumber}`;
    });

    const oldTextForSearch = task.textForSearch;
    task.textForSearch = ko.computed(() => {
        const old = oldTextForSearch();
        const githubNumber = task.githubNumber();
        return `${old} #${githubNumber}`;
    });
}

function githubRepositoryLinkBlockTemplate () {
    return `
<!-- ko if: project.githubRepository -->
<div class="form-group">
    <label for="github-repository-link" class="control-label">
      <span class="glyphicon glyphicon-link"> GitHub</span>
    </label>
    <p><a class="form-control-static" id="github-repository-link" target="_blank" data-bind="
                text: project.githubRepository.displayText,
                attr: { href: project.githubRepository.url } "></a></p>
</div>
<!-- /ko -->
`;
}

function githubLinkItemTemplate () {
    return `
<!-- ko if: task.githubUrl -->
<li class="mini-menu-item" data-bind="tooltip: {title: 'github link', placement: 'left'}">
    <a target="_blank" class="btn btn-sm btn-default" data-bind="attr: {href: task.githubUrl }">
        <span class="glyphicon glyphicon-link" aria-hidden="true"></span>
    </a>
</li>
<!-- /ko -->
`;
}

function githubTaskLinkBlockTemplate () {
    return `
<!-- ko if: task().githubUrl -->
<div data-bind="if: task().githubUrl" class="form-group">
    <a target="_blank" data-bind="attr: { href: task().githubUrl }">
        <span class="glyphicon glyphicon-link" aria-hidden="true"></span> GitHub
    </a>
</div>
<!-- /ko -->
`;
}
