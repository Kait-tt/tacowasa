'use strict';
require('bootstrap');
require('../../scss/user.scss');
require('babel-polyfill');
const ko = require('knockout');
const moment = require('moment');
const effects = require('../views/effects');
const Project = require('../models/project');
const block = require('../modules/block');
const Alert = require('../../components/alert');
const CreateProjectModal = require('../../components/modals/create_project_modal');
const RemoveProjectModal = require('../../components/modals/remove_project_modal');
const ImportProjectByGitHub = require('../../components/modals/import_project_by_github_modal');

moment.locale('ja');

const alert = new Alert({maxAlertNum: 2});
alert.register();

const projects = ko.observableArray();
const selectedProject = ko.observable();

const createProjectModal = new CreateProjectModal();
createProjectModal.on('submit', ({projectName}) => {
    block.block();
    Project.create({projectName})
        .then(project => {
            block.unblock();
            alert.pushSuccessAlert({message: `プロジェクト ${projectName} を作成しました。`});
            projects.unshift(project);
        })
        .catch(err => {
            block.unblock();
            alert.pushErrorAlert({message: `プロジェクト ${projectName} の作成に失敗しました。`});
            console.error(err);
        });
});
createProjectModal.register();

const removeProjectModal = new RemoveProjectModal();
removeProjectModal.on('submit', ({project}) => {
    project.remove()
        .then(() => {
            alert.pushSuccessAlert({message: `プロジェクト ${project.name()} を削除しました。`});
            projects.remove(project);
        })
        .catch(err => {
            alert.pushErrorAlert({message: `プロジェクト ${project.name()} の削除に失敗しました。`});
            console.error(err);
        });
});
removeProjectModal.register();
selectedProject.subscribe(project => {
    removeProjectModal.project = project;
});

const importProjectByGitHub = new ImportProjectByGitHub();
importProjectByGitHub.on('submit', ({username, reponame}) => {
    block.block();
    Project.importByGitHub({username, reponame})
        .then(project => {
            block.unblock();
            alert.pushSuccessAlert({message: `プロジェクト ${username}/${reponame} を作成しました。`});
            projects.unshift(project);
        })
        .catch(err => {
            block.unblock();
            alert.pushErrorAlert({message: `プロジェクト ${username}/${reponame} の作成に失敗しました。`});
            console.error(err);
        });
});
importProjectByGitHub.register();

const vm = {
    alerts: alert.alerts,
    projects,
    selectedProject
};

Project.fetchAll()
    .then(_projects => {
        _projects.forEach(x => projects.push(x));
        effects.applyBindings(window);
        ko.applyBindings(vm);
    })
    .catch(err => console.error(err));
