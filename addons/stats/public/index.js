'use strict';
const ko = require('knockout');
const Iteration = require('./models/iteration');
const IterationTableComponent = require('./iteration_table_component');
const PredicateCompletionTimeComponent = require('./prediction_completion_time_component');
const StagnationTaskViewModel = require('./viewmodels/stagnation_task');
const BurnDownChartComponent = require('./burn_down_chart_component');
const TaskDetailPredictComponent = require('./task_detail_predict_component');

module.exports = {
    init: (kanban, {alert}) => {
        const socket = kanban.socket;

        const iterations = ko.observableArray();
        const workTimes = ko.observable();
        const stagnantTaskIds = ko.observableArray([]);

        const stagnationTaskViewModel = new StagnationTaskViewModel(stagnantTaskIds);
        stagnationTaskViewModel.initDecorateTask(kanban.project.tasks);
        stagnationTaskViewModel.initDecorateTaskCard(kanban.taskCard);

        const predicateCompletionTimeComponent = new PredicateCompletionTimeComponent(kanban.project.users);
        kanban.selectedTask.subscribe(x => predicateCompletionTimeComponent.task(x));
        predicateCompletionTimeComponent.register();

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

        const burnDownChartComponent = new BurnDownChartComponent();
        kanban.projectStatsModal.on('shownModal', () => {
            burnDownChartComponent.drawChart();
        });
        burnDownChartComponent.register();

        const taskDetailPredictComponent = new TaskDetailPredictComponent();
        kanban.selectedTask.subscribe(x => taskDetailPredictComponent.task(x));
        taskDetailPredictComponent.register();

        // init socket events

        let first = true;
        socket.on('stats', req => {
            console.debug('on stats', req);
            predicateCompletionTimeComponent.updateMemberStats(req.members);
            stagnantTaskIds(req.stagnantTaskIds);
            workTimes(req.workTimes);
            burnDownChartComponent.bdc(req.burnDownChart);
            burnDownChartComponent.drawChart();
            taskDetailPredictComponent.memberStats(req.members);
            if (first) {
                first = false;
                req.iterations.forEach(iterationParams => {
                    const iteration = new Iteration(iterationParams);
                    iterations.push(iteration);
                });
            }
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

        // init rendering

        kanban.projectStatsModal.on('load', () => {
            insertNodeIntoFirstOnModal(iterationTableComponent.componentName, 'project-stats-modal');
            insertNodeIntoFirstOnModal(burnDownChartComponent.componentName, 'project-stats-modal');
        });

        kanban.assignTaskModal.on('load', () => {
            insertNodeIntoLastOnModal(predicateCompletionTimeComponent.componentName, 'assign-task-modal');
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
