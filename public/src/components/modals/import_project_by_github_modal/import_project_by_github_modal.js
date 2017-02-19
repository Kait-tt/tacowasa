'use strict';
const ko = require('knockout');
const AbstractModalComponent = require('../abstract_modal_component');

class RemoveProjectModal extends AbstractModalComponent {
    constructor ({eventEmitterOptions = {}} = {}) {
        super({eventEmitterOptions});
        this.username = ko.observable();
        this.reponame = ko.observable();
    }

    submit () {
        this.emit('submit', {username: this.username(), reponame: this.reponame()});
    }

    get template () { return require('html-loader!./import_project_by_github_modal.html'); }

    get modalName () { return 'import-project-by-github-modal'; }
}

module.exports = RemoveProjectModal;
