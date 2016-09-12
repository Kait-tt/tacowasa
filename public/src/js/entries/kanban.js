'use strict';
require('babel-polyfill');
require('jquery-ui');
require('jquery.easing');
require('marked');
require('bootstrap');
require('bootstrap-select');
require('knockout');
require('../modules/knockout/knockout-selectPicker');
require('../modules/knockout/knockout-bootstrap-switch');
require('../../scss/kanban.scss');
// TODO: require knockout-bootstrap
// TODO: require and init markdown

const global = window;
const ko = require('knockout');
const Kanban = require('../viewmodels/kanban');
const Project = require('../models/project');
const effects = require('../views/effects');
const Scroller = require('../views/scroller');
const Alert = require('../viewmodels/alert');
const AlertHub = require('../viewmodels/alert_hub');
const MiniMenu = require('../views/mini_menu');

let kanban, project, alertHub, vm;

const projectId = getProjectId();

const alert = new Alert();

const scroller = new Scroller({
    selector: ['.task-board'].join(','),
    cancelSelector: ['.task-card', '.activity-wrap', '.modal'].join(',')
});

Project.fetch(projectId)
    .then(_project => {
        project = _project;
        kanban = new Kanban({project});
        alertHub = new AlertHub({alert, kanban, socket: kanban.socket});

        // knockout sortable option
        ko.bindingHandlers.sortable.options.scroll = false;
        ko.bindingHandlers.sortable.beforeMove = kanban.onBeforeMoveDrag.bind(kanban);

        vm = kanban;
        vm.alerts = alert.alerts;

        effects.applyBindings(global);
        MiniMenu.applyBindings(global);
        MiniMenu.init(null);
        ko.applyBindings(vm);

        setConfirmTransition();

        // 統計モーダルを開いたら統計を計算
        $('#project-stats-modal').on('show.bs.modal', () => project.stats.calcIterationWorkTime());
    });

// 作業中で画面遷移しようとしたら確認ダイアログを表示する
function setConfirmTransition() {
    $(window).bind('beforeunload', () => {
        const user = kanban.loginUser();
        if (user && user.workingTask()) {
            return '*** ひとつ以上のタスクが作業状態になっています。 ***\n作業中のまま画面を移動しますか？';
        }
    });
}

function getProjectId() {
    return _.compact(location.pathname.split('/')).splice(-2, 1)[0];
}