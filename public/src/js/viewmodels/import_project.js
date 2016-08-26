'use strict';
const ko = require('knockout');
const block = require('../modules/block');
const Project = require('../models/project');

class ImportProject {
    constructor(projects) {
        this.projects = projects;
        this.username = ko.observable();
        this.reponame = ko.observable();
    }

    submit() {
        block.block();
        return Project.importByGitHub({
            username: this.username(),
            reponame: this.reponame()
        }).then(project => {
            this.projects.unshift(project);
            block.unblock();
        }, err => {
            block.unblock();
            throw new Error(err);
        });
    }

}

module.exports = ImportProject;
