'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class RemoveProjectModal extends EventEmitter2 {
    constructor(opts={}) {
        super(opts);
        this.username = ko.observable();
        this.reponame = ko.observable();
    }

    submit() {
        this.emit('submit', {username: this.username(), reponame: this.reponame()});
    }

    register() {
        ko.components.register('import-project-by-github-modal', {
            viewModel: () => this,
            template: this.template()
        })
    }

    template() {
        return `
<div class="modal fade" id="import-project-modal" tabindex="-1" role="dialog" aria-labelledby="import-project-modal-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="import-project-modal-label">Import Project</h4>
            </div>
            <form class="form">
                <div class="modal-body">
                    <p>
                        GitHubから新しいプロジェクトをインポートします。<br>
                        リポジトリの情報を入力してください。
                    </p>
                    <div class="form-group">
                        <label for="import-username" class="control-label">GitHubのユーザ名</label>
                        <input type="text" class="form-control" id="import-username" placeholder="GitHub User Name"
                               data-bind="value: username" required>
                    </div>
                    <div class="form-group">
                        <label for="import-repository-name" class="control-label">GitHubのリポジトリ名</label>
                        <input type="text" class="form-control" id="import-repository-name" placeholder="GitHub Repository Name"
                                data-bind="value: reponame" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success" data-dismiss="modal"
                            data-bind="click: submit">Import</button>
                </div>
            </form>

        </div>
    </div>
</div>
`;
    }
}

module.exports = RemoveProjectModal;