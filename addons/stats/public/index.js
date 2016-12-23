'use strict';
const ko = require('knockout');
const Iteration = require('./models/iteration');
const IterationTableComponent = require('./iteration_table_component');
const PredictTimeComponent = require('./predict_time_component');
const StagnationTaskViewModel = require('./viewmodels/stagnation_task');
const NotifyStagnationSettingsComponent = require('./notify_stagnation_settings_component');
const TaskDetailPredictComponent = require('./task_detail_predict_component');
const BurnDownChartComponent = require('./burn_down_chart_component');
const MembersPredictChartComponent = require('./members_predict_chart_component');

module.exports = {
    init: (kanban, {alert}) => {
        const socket = kanban.socket;

        const iterations = ko.observableArray([]);
        const workTimes = ko.observableArray([]);
        const stagnantTaskIds = ko.observableArray([]);
        const bdcData = ko.observableArray([]);

        const stagnationTaskViewModel = new StagnationTaskViewModel(stagnantTaskIds);
        stagnationTaskViewModel.initDecorateTask(kanban.project.tasks);
        stagnationTaskViewModel.initDecorateTaskCard(kanban.taskCard);

        const notifyStagnationSettingsComponent = new NotifyStagnationSettingsComponent();
        notifyStagnationSettingsComponent.on('save', ({url}) => {
            socket.emit('updateNotifyStagnant', {url});
        });
        notifyStagnationSettingsComponent.register();

        const predictTimeComponent = new PredictTimeComponent(kanban.project.users, iterations, workTimes);
        kanban.selectedTask.subscribe(x => predictTimeComponent.task(x));
        predictTimeComponent.register();

        const iterationTableComponent = new IterationTableComponent(iterations, kanban.project.users, workTimes);
        iterationTableComponent.register();
        iterationTableComponent.on('createIteration', ({startTime, endTime}) => {
            socket.emit('createIteration', {startTime, endTime});
        });
        iterationTableComponent.on('removeIteration', ({iterationId}) => {
            socket.emit('removeIteration', {iterationId});
        });
        iterationTableComponent.on('updateIteration', ({iterationId, startTime, endTime}) => {
            socket.emit('updateIteration', {iterationId, startTime, endTime});
        });
        iterationTableComponent.on('updatePromisedWorkTime', ({userId, iterationId, promisedMinutes}) => {
            socket.emit('updatePromisedWorkTime', {userId, iterationId, promisedMinutes});
        });

        const burnDownChartComponent = new BurnDownChartComponent(bdcData, iterations, workTimes);
        kanban.projectStatsModal.on('shownModal', () => {
            burnDownChartComponent.drawChart();
            membersPredictChartComponent.drawChart();
        });
        burnDownChartComponent.register();

        const membersPredictChartComponent = new MembersPredictChartComponent(kanban.project.users, kanban.project.costs);
        membersPredictChartComponent.register();

        const taskDetailPredictComponent = new TaskDetailPredictComponent();
        kanban.selectedTask.subscribe(x => taskDetailPredictComponent.task(x));
        taskDetailPredictComponent.register();

        // init socket events

        let first = true;
        socket.on('stats', req => {
            console.debug('on stats', req);
            predictTimeComponent.updateMemberStats(req.members);
            stagnantTaskIds(req.stagnantTaskIds);
            workTimes(req.workTimes);
            bdcData(req.burnDownChart);
            taskDetailPredictComponent.memberStats(req.members);
            membersPredictChartComponent.memberStats(req.members);
            if (first) {
                first = false;
                req.iterations.forEach(iterationParams => {
                    const iteration = new Iteration(iterationParams);
                    iterations.push(iteration);
                });
                notifyStagnationSettingsComponent.url(req.project.notifyUrl);
            }
            burnDownChartComponent.drawChart();
            membersPredictChartComponent.drawChart();
        });

        socket.on('initJoinedUsernames', () => { // init
            socket.emit('fetchStats');
        });

        socket.on('createIteration', ({iteration: iterationParams}) => {
            const iteration = new Iteration(iterationParams);
            iterations.push(iteration);
        });

        socket.on('removeIteration', ({iterationId}) => {
            const iteration = iterations().find(x => x.id() === iterationId);
            if (!iteration) { throw new Error(`iteration is not found by ${iterationId}`); }
            iterations.remove(iteration);
        });

        socket.on('updateIteration', ({iteration: iterationParams}) => {
            const iteration = iterations().find(x => x.id() === iterationParams.id);
            if (!iteration) { throw new Error(`iteration is not found by ${iterationParams.id}`); }
            iteration.update(iterationParams);
        });

        socket.on('updatePromisedWorkTime', ({memberWorkTime}) => {
            const _workTimes = workTimes().map(x => {
                return x.id === memberWorkTime.id ? memberWorkTime : x;
            });
            workTimes(_workTimes);
        });

        socket.on('updateNotifyStagnant', ({url}) => {
            notifyStagnationSettingsComponent.url(url);
        });

        // init rendering

        kanban.projectStatsModal.on('load', () => {
            insertNodeIntoFirstOnModal(iterationTableComponent.componentName, 'project-stats-modal');
            insertNodeIntoFirstOnModal(membersPredictChartComponent.componentName, 'project-stats-modal');
            insertNodeIntoFirstOnModal(burnDownChartComponent.componentName, 'project-stats-modal');
            insertNodeIntoLastOnModal(notifyStagnationSettingsComponent.componentName, 'project-stats-modal');
        });

        kanban.assignTaskModal.on('load', () => {
            insertNodeIntoLastOnModal(predictTimeComponent.componentName, 'assign-task-modal');
        });

        kanban.taskDetailModal.on('load', () => {
            insertNodeAfterOnModal(taskDetailPredictComponent.componentName, 'task-detail-modal', '.all-work-time-wrapper');
        });
    }
};

function insertNodeAfterOnModal (componentName, modalId, selector) {
    const modal = document.getElementById(modalId);
    const modalBody = modal.getElementsByClassName('modal-body')[0];
    const child = modalBody.querySelector(selector);
    const component = document.createElement(componentName);
    child.parentNode.insertBefore(component, child.nextSibling);
}

function insertNodeIntoFirstOnModal (componentName, modalId) {
    const modal = document.getElementById(modalId);
    const modalBody = modal.getElementsByClassName('modal-body')[0];
    const firstChild = Array.prototype.slice.call(modalBody.childNodes).find(x => x.nodeType === 1);
    const component = document.createElement(componentName);
    modalBody.insertBefore(component, firstChild);
}

function insertNodeIntoLastOnModal (componentName, modalId) {
    const modal = document.getElementById(modalId);
    const modalBody = modal.getElementsByClassName('modal-body')[0];
    const component = document.createElement(componentName);
    modalBody.append(component);
}
