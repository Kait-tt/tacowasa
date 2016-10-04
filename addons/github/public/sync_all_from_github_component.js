'use strict';
const ko = require('knockout');
const block = require('../../../public/src/js/modules/block');
const EventEmitter2 = require('eventemitter2');

class SyncAllFromGitHubComponent extends EventEmitter2 {
    constructor (kanban, project, {eventEmitterOptions} = {}) {
        super(eventEmitterOptions);
        this.kanban = kanban;
        this.socket = kanban.socket;
        this.project = project;
        this.syncStatus = ko.observable(false);
    }

    get componentName () {
        return 'sync-all-from-github-component';
    }

    initSocket () {
        SyncAllFromGitHubComponent.socketOnKeys.forEach(key => {
            this.socket.debugOnEvent(key);
            this.socket.on(key, req => this[key](req));
        });
    }

    register () {
        const that = this;
        ko.components.register(this.componentName, {
            viewModel: function () {
                this.project = that.project;
                this.syncStatus = that.syncStatus;
                this.clickSync = () => {
                    that.syncAllFromGitHub();
                };
            },
            template: this.template
        });
    }

    syncAllFromGitHub () {
        this.socket.emit('syncAllFromGitHub');
    }

    // on events
    startSyncAllFromGitHub () {
        block.block('同期中...');
        this.syncStatus(true);
    }

    completedSyncAllFromGitHub () {
        block.unblock();
        this.syncStatus(false);
        this.emit('completedSyncAllFromGitHub');
    }

    failedSyncAllFromGitHub ({error}) {
        console.error(error);
        block.unblock();
        this.syncStatus(false);
        this.emit('failedSyncAllFromGitHub', {error});
    }

    get template () {
        return `
<!-- ko if: project.githubRepository -->
<div class="form-group">
  <button type="button" class="btn btn-warning" data-bind="
    click: clickSync,
    disable: syncStatus,
    attr: {disabled: syncStatus}
    ">
    GitHubを元に全てのタスクとラベルを同期し直す
  </button>
</div>
<!-- /ko -->
`;
    }

    static get socketOnKeys () {
        return [
            'startSyncAllFromGitHub',
            'completedSyncAllFromGitHub',
            'failedSyncAllFromGitHub'
        ];
    }
}

module.exports = SyncAllFromGitHubComponent;
