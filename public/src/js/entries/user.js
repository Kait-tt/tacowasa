// (function (global, $, _, ko, util) {
'use strict';
require('bootstrap');
require('../../scss/user.scss');
require('babel-polyfill');
const ko = require('knockout');
const ImportProject = require('../viewmodels/import_project');
const Alert = require('../viewmodels/alert');
const effects = require('../views/effects');
const Project = require('../models/project');

const alert = new Alert({maxAlertNum: 2});
const projects = ko.observableArray();
const importProject = new ImportProject({projects});

const vm = {
    importProject,
    alerts: alert.alerts,
    projects: projects.items,
    removeProject: null,
    selectedProject: ko.observable()
};

vm.importProject.submit = alert.wrapAlert(importProject.submit.bind(importProject),
    'ProjectのImportに成功しました',
    'ProjectのImportに失敗しました');

vm.removeProject = alert.wrapAlert(removeProject,
    'Projectの削除に成功しました',
    'Projectの削除に失敗しました');

$('[data-toggle="tooltip"]').tooltip();

Project.fetchAll()
    .then(_projects => {
        _projects.forEach(x => projects.push(x));
        effects.applyBindings(window);
        ko.applyBindings(vm);
    })
    .catch(err => console.error(err));

function removeProject() {
    const project = vm.selectedProject();
    return project.remove()
        .then(() => {
            projects.items.remove(project);
        })
        .catch(err => console.error(err));
}
