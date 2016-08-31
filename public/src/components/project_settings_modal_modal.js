'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class ArchiveTaskModal extends EventEmitter2 {
    constructor({eventEmitterOptions={}, project}) {
        super(eventEmitterOptions);
        this.project = project;
    }

    register() {
        ko.components.register('project-settings-modal', {
            viewModel: () => this,
            template: this.template()
        })
    }

    template() {
        return `<div class="modal fade" id="project-settings-modal" tabindex="-1" role="dialog" aria-labelledby="project-settings-modal-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="project-settings-modal-label">Project settings</h4>
            </div>
            <div class="modal-body">
                <form class="form">
                    <div class="form-group">
                        <label for="project-settings-name" class="control-label">
                            <span class="glyphicon glyphicon-blackboard"> Name</span>
                        </label>
                        <p class="form-control-static" id="project-name" data-bind="text: project.name"></p>
                    </div>

                    <!-- TODO: github -->
                    <!-- ko if: false && github() -->
                    <div class="form-group">
                        <label for="project-settings-github-link" class="control-label">
                            <span class="glyphicon glyphicon-link"> GitHub</span>
                        </label>
                        <p><a class="form-control-static" id="github-link" target="_blank" data-bind="
                            text: github().userName() + '/' + github().repoName(),
                            attr: { href: github().url } "></a></p>
                    </div>

                    <div class="form-group">
                        <label for="project-settings-github-sync-enabled" class="control-label">
                            <span class="glyphicon glyphicon-blackboard"> 同期</span>
                        </label>
                        <p>
                            <!--<input class="switch" id="project-settings-github-sync-enabled" type="checkbox"-->
                                   <!--data-size="mini" data-bind="checked: github().sync">-->
                            <!-- ko if: $root.project.github().sync -->
                            <span class="label label-primary">同期ON</span>
                            <!-- /ko -->
                            <!-- ko ifnot: $root.project.github().sync -->
                            <span class="label label-default">同期OFF</span>
                            <!-- /ko -->
                            <span class="text-warning">同期状態の変更はサポートしていません。変更をしたい場合は管理者へお問い合わせください。</span>
                        </p>
                    </div>
                    <!-- /ko -->
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>`;
    }
}

module.exports = ArchiveTaskModal;