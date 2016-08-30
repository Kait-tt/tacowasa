'use strict';
require('bootstrap');
require('../../scss/kanban.scss');
require('babel-polyfill');
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
    selectors: ['body', '.main', '.stage-block'],
    cancelSelectors: ['.card', '#activity-wrap']
});

Project.fetch(projectId)
    .then(_project => {
        project = _project;
        kanban = new Kanban({project});
        alertHub = new AlertHub({alert, kanban, socket: kanban.socket});

        // knockout sortable option
        ko.bindingHandlers.sortable.options.scroll = false;
        ko.bindingHandlers.sortable.beforeMove = kanban.onBeforeMoveDrag;

        vm = kanban;
        vm.alerts = alerts.alerts;

        effects.applyBindings(global);
        MiniMenu.applyBindings(global);
        MiniMenu.init(null);
        ko.applyBindings(vm);

        initIssueMarkDown();
        setConfirmTransition();

        // 統計モーダルを開いたら統計を計算
        $('#project-stats-modal').on('show.bs.modal', () => project.stats.calcIterationWorkTime());
    });

// TODO: components化 or components.TaskDetailModal に移動
function initIssueMarkDown() {
    let markDownEle;
    const $content = $('#task-detail-modal>.body, #add-issue-body');
    let body = kanban.taskDetailModal.body;

    $.fn.markdown.messages['en'] = {
        'Preview': 'Preview/Edit'
    };

    $content.markdown({
        resize: 'both',
        onShow: function (e) {
            markDownEle = e;
        }
    });

    body.subscribe(function () {
        markDownEle.hidePreview();
        setTimeout(function () {
            markDownEle.showPreview();
        }, 300);
    });
}

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