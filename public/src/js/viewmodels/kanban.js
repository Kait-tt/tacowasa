'use strict';
const global = window;
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');
const _ = require('lodash');
const moment = require('moment');

// modules
const util = require('../modules/util');
const localStorage = require('../modules/localStorage');

// models
const Socket = require('../models/socket');
const ProjectStats = require('../models/project_stats');
const SocketSerializer = require('../models/socket_serializer');
const Activity = require('../models/activity');

// viewmodels
const DraggableTaskList = require('../../components/task_card_list/draggable_task_list');

// components
const CreateTaskModel = require('../../components/create_task_modal');
const AssignTaskModal = require('../../components/assign_task_modal');
const ArchiveTaskModal = require('../../components/archive_task_modal');
const UsersSettingsModal = require('../../components/users_settings_modal');
const UserSettingsModal = require('../../components/user_settings_modal');
const RemoveUserModal = require('../../components/remove_user_modal');
const ArchiveAllTaskModal = require('../../components/archive_all_tasks_modal');
const ProjectSettingsModal = require('../../components/project_settings_modal');
const ProjectLabelsModal = require('../../components/project_labels_modal');
const ProjectStatsModal = require('../../components/project_stats_modal');
const TaskDetailModal = require('../../components/task_detail_modal');
const TaskCard = require('../../components/task_card');
const TaskCardList = require('../../components/task_card_list');
const UserLabel = require('../../components/user_label');
const TaskCardMiniMenu = require('../../components/task_card_mini_menu');


/**
 * カンバンのViewModel
 *
 * @event overWIPLimitDropped(arg, user, targetSlaveTaskList) WIPリミットを超えてD&Dした (argはknockout-sortable.beforeMoveイベント引数のarg）
 * @event workingTaskDropped(arg, task)
 */
class Kanban extends EventEmitter2 {
    constructor({eventEmitterOptions = {}, project}) {
        super(eventEmitterOptions);

        this.joinedUsers = ko.observableArray();
        this.activities = ko.observableArray();

        this.searchQuery = ko.observable();
        this.searchQuery.subscribe(_.debounce(this.searchTasks, 500));

        this.viewMode = ko.observable(localStorage.getItem('viewMode')); // full or compact
        this.viewMode.subscribe(val => localStorage.setItem('viewMode', val));

        this.project = project;
        this.users = project.users;
        this.tasks = project.tasks;
        this.labels = project.labels;
        this.stages = project.stages;
        this.stats = new ProjectStats({project});

        this.loginUser = ko.computed(() => this.users().find(user => user.username() === global.username));

        this.canAssignUsers = ko.computed(() => this.users().filter(user => !user.isWipLimited()));

        this.selectedTask = ko.observable();
        this.selectedUser = ko.observable();

        this.socket = null;
        this.socketSerializer = null;
        this.initSocket();

        this.initModals();
    }

    initSocket() {
        this.socket = new Socket();
        this.socketSerializer = new SocketSerializer({socket: this.socket, project: this.project, kanban: this});
        this.socket.initSocketDebugMode();

        let joined = false;
        this.socket.on('connect', () => {
            if (!joined) {
                joined = true;
                this.socket.emit('joinProjectRoom', {projectId: this.project.id()});
            }
        });

        if (this.socket.connected) {
            if (!joined) {
                joined = true;
                this.socket.emit('joinProjectRoom', {projectId: this.project.id()});
            }
        }

        this.socket.on('disconnect', () => {
            joined = false;
        });
    }

    initModals() {
        // createTaskModel
        this.createTaskModel = new CreateTaskModel({project: this.project});
        this.createTaskModel.on('create', ({title, body, stage, cost, labels}) => {
            this.socket.emit('createTask', {
                title,
                body,
                stageId: stage.id(),
                costId: cost.id(),
                labelIds: labels.map(x => x.id())
            });
        });
        this.createTaskModel.register();

        // assignTaskModal
        this.assignTaskModal = new AssignTaskModal({project: this.project});
        this.assignTaskModal.on('assign', ({task, user}) => {
            this.socket.emit('updateTaskStatus', ({
                taskId: task.id(),
                userId: user.id(),
                stageId: this.stages().find(x => x.name() === 'todo').id()
            }));
        });
        this.assignTaskModal.task.subscribe(x => this.selectedTask(x));
        this.assignTaskModal.register();

        // archiveTaskModal
        this.archiveTaskModal = new ArchiveTaskModal({project: this.project});
        this.archiveTaskModal.on('', ({task}) => {
            this.socket.emit('archiveTask', {taskId: task.id()});
        });
        this.archiveTaskModal.task.subscribe(x => this.selectedTask(x));
        this.archiveTaskModal.register();

        // removeUserModal
        this.removeUserModal = new RemoveUserModal({project: this.project});
        this.removeUserModal.on('remove', ({}) => {
            this.socket.emit('remove', {username: user.username()});
        });
        this.removeUserModal.user.subscribe(x => this.selectedUser(x));
        this.removeUserModal.register();

        // usersSettingsModal
        this.usersSettingsModal = new UsersSettingsModal({project: this.project});
        this.usersSettingsModal.on('updateOrder', ({user, beforeUser}) => {
            this.socket.emit('updateUserOrder', {
                username: user.username(),
                beforeUsername: beforeUser && beforeUser.username()
            });
        });
        this.usersSettingsModal.on('visible', ({user, isVisible}) => {
            this.socket.emit('updateUser', {
                username: user.username(),
                updateParams: {isVisible}
            });
        });
        this.usersSettingsModal.on('addUser', ({username}) => {
            this.socket.emit('addUser', {username});
        });
        this.usersSettingsModal.register();

        // userSettingsModal
        this.userSettingsModal = new UserSettingsModal({project: this.project});
        this.userSettingsModal.on('remove', ({user}) => {
            this.removeUserModal.user = user;
            $('#user-settings-modal').modal('hide');
            $('#remove-user-modal').modal('show');
        });
        this.userSettingsModal.on('update', ({user, wipLimit}) => {
            this.socket.emit('updateUser', {
                username: user.username(),
                updateParams: {wipLimit}
            });
        });
        this.userSettingsModal.user.subscribe(x => this.selectedUser(x));
        this.userSettingsModal.register();

        // archiveAllTaskModal
        this.archiveAllTaskModal = new ArchiveAllTaskModal({project: this.project});
        this.archiveAllTaskModal.on('archiveAll', ({}) => {
            this.project.getTasks({stageOrWhere: 'done'}).forEach(task => {
                this.socket.emit('archiveTask', {taskId: task.id()});
            });
        });
        this.archiveAllTaskModal.register();

        // projectSettingsModal
        this.projectSettingsModal = new ProjectSettingsModal({project: this.project});
        this.projectSettingsModal.register();

        // projectLabelsModal
        this.projectLabelsModal = new ProjectLabelsModal({project: this.project});
        this.projectLabelsModal.register();

        // projectStatsModal
        this.projectStatsModal = new ProjectStatsModal({project: this.project, stats: this.stats});
        this.projectStatsModal.register();

        // taskDetailModal
        this.taskDetailModal = new TaskDetailModal({project: this.project});
        this.taskDetailModal.on('update', ({task, title, body, cost, labels}) => {
            this.socket.emit('updateTaskContent', {
                taskId: task.id(),
                updateParams: {
                    title,
                    body,
                    costId: cost.id()
                }
            });

            const attachLabels = _.difference(labels, task.labels());
            const detachLabels = _.difference(task.labels(), labels);
            attachLabels.forEach(label => {
                this.socket.emit('attachLabel', {
                    taskId: task.id(),
                    labelId: label.id()
                })
            });
            detachLabels.forEach(label => {
                this.socket.emit('detachLabel', {
                    taskId: task.id(),
                    labelId: label.id()
                });
            })
        });
        this.taskDetailModal.on('saveWorkHistory', ({task, works}) => {
            const taskId = task.id();
            this.socket.emit('updateTaskWorkHistory', {
                taskId: taskId,
                works: works.map(x => _.assign(x.deserialize(), {taskId: taskId}))
            });
        });
        this.selectedTask.subscribe(x => this.taskDetailModal.task(x));
        this.taskDetailModal.register();

        // taskCard
        this.taskCard = new TaskCard();
        this.taskCard.on('clickTaskCard', ({task}) => {
            this.selectedTask(task);
        });
        this.taskCard.on('clickWork', ({task}) => {
            this.socket.emit('updateTaskWorkingState', {
                taskId: task.id(),
                isWorking: !task.isWorking()
            });
        });
        this.taskCard.register();

        // taskCardList
        this.taskCardList = new TaskCardList({project: this.project});
        this.taskCardList.on('updateTaskStatus', ({task, stage, user}) => {
            this.socket.emit('updateTaskStatus', {
                taskId: task.id(),
                updateParams: {
                    stageId: stage && stage.id(),
                    userId: user && user.id()
                }
            });
        });
        this.taskCardList.on('updateTaskOrder', ({task, beforeTask}) => {
            this.socket.emit('updateTaskOrder', {
                taskId: task.id(),
                beforeTaskId: beforeTask ? beforeTask.id() : null
            });
        });
        this.taskCardList.register();

        // UserLabel
        this.userLabel = new UserLabel();
        this.userLabel.on('clickUserSettings', ({user}) => {
            this.selectedUser(user);
        });
        this.userLabel.register();

        // TaskCardMiniMenu
        this.taskCardMiniMenu = new TaskCardMiniMenu();
        this.taskCardMiniMenu.register();

    }

    // TODO: move to TaskCardList
    onBeforeMoveDrag(arg) {
        const list = arg.targetParent.parent;
        const task = arg.item;

        if (!(list instanceof DraggableTaskList)) {
            return;
        }

        // 作業中か
        if (task.isWorking()) {
            arg.cancelDrop = true;
            this.emit('workingTaskDropped', arg, task);
        }

        // WIPLimitに達するか
        if (list.user && task.user() !== list.user) {
            const user = list.user;
            const cost = task.cost();
            if (user.willBeOverWipLimit(cost.value())) {
                arg.cancelDrop = true;
                this.emit('overWIPLimitDropped', arg, user, list);
            }
        }
    }

    searchTasks(searchQuery = '') {
        searchQuery = searchQuery.trim();

        if (searchQuery) { // search
            const queries = util.splitSearchQuery(searchQuery);
            this.tasks().forEach(task => {
                const text = task.textForSearch();
                task.isVisible(queries.every(q => _.includes(text, q)));
            });

        } else { // all visible
            this.tasks().forEach(task => {
                task.isVisible(true);
            });
        }
    }

    /*** minimenu ***/
    // that.onClickIssueDetail = function (issue, e) {
    //     that.selectedIssue(issue);
    //     var $ele = $(e.target.parentElement);
    //     if ($ele.attr('data-toggle') !== 'modal') {
    //         $ele = $ele.parents('li[data-toggle=modal]');
    //     }
    //     $($ele.attr('data-target')).modal('show');
    //     return util.cancelBubble(e);
    // };
    //
    // that.onClickIssueNextStage = function (issue, e) {
    //     that.nextStage(issue);
    //     return util.cancelBubble(e);
    // };
    //
    // that.onClickIssuePrevStage = function (issue, e) {
    //     that.prevStage(issue);
    //     return util.cancelBubble(e);
    // };
    //
    // that.onClickIssueArchive = function (issue, e) {
    //     that.selectedIssue(issue);
    //     var $ele = $(e.target.parentElement);
    //     if ($ele.attr('data-toggle') !== 'modal') {
    //         $ele = $ele.parents('li[data-toggle=modal]');
    //     }
    //     $($ele.attr('data-target')).modal('show');
    //     return util.cancelBubble(e);
    // };
    //
    // that.onClickIssueAssign = function (issue, e) {
    //     that.selectedIssue(issue);
    //     var $ele = $(e.target.parentElement);
    //     if ($ele.attr('data-toggle') !== 'modal') {
    //         $ele = $ele.parents('li[data-toggle=modal]');
    //     }
    //     $($ele.attr('data-target')).modal('show');
    //     return util.cancelBubble(e);
    // };
    //
    // that.onClickDeleteMember = function () {
    //     $('*').modal('hide');
    //     return true;
    // };

    /*** work button ***/
    // that.onClickStartToWork = function (issue) {
    //     that.socket.emit('update-issue-working-state', {
    //         issueId: issue._id(),
    //         isWorking: true
    //     }, _.noop());
    // };
    //
    // that.onClickStopToWork = function (issue) {
    //     that.socket.emit('update-issue-working-state', {
    //         issueId: issue._id(),
    //         isWorking: false
    //     }, _.noop());
    // };
    //
    // that.onClickToggleWorkOnCard = function (issue, e) {
    //     that.socket.emit('update-issue-working-state', {
    //         issueId: issue._id(),
    //         isWorking: !issue.isWorking()
    //     }, _.noop());
    //     util.cancelBubble(e);
    //     return false;
    // };


    /*** activity ***/
    // that.addChatText = function (chat) {
    //     var time = moment(chat.created_at).format('MM/DD HH:mm:ss');
    //     that.chatTexts.push('[' + time + '] (' + chat.sender + ') ' + chat.content);
    // };

    addActivity(activity) {
        this.activities.push(new Activity(activity));
    }
}

module.exports = Kanban;
