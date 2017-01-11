'use strict';
const global = window;
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');
const _ = require('lodash');

// modules
const localStorage = require('../modules/localStorage');

// models
const Socket = require('../models/socket');
const ProjectStats = require('../models/project_stats');
const SocketSerializer = require('../models/socket_serializer');
const Activity = require('../models/activity');
const TaskSearchQuery = require('../models/task_search_query');

// viewmodels
const DraggableTaskList = require('../../components/task_card_list/draggable_task_list');

// components
const CreateTaskModel = require('../../components/modals/create_task_modal');
const AssignTaskModal = require('../../components/modals/assign_task_modal');
const ArchiveTaskModal = require('../../components/modals/archive_task_modal');
const UsersSettingsModal = require('../../components/modals/users_settings_modal');
const UserSettingsModal = require('../../components/modals/user_settings_modal');
const RemoveUserModal = require('../../components/modals/remove_user_modal');
const ArchiveAllTaskModal = require('../../components/modals/archive_all_tasks_modal');
const ProjectSettingsModal = require('../../components/modals/project_settings_modal');
const ProjectLabelsModal = require('../../components/modals/project_labels_modal');
const ProjectStatsModal = require('../../components/modals/project_stats_modal');
const TaskDetailModal = require('../../components/modals/task_detail_modal');
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
    constructor ({eventEmitterOptions = {}, project}) {
        super(eventEmitterOptions);
        localStorage.load();

        this.joinedUsers = ko.observableArray([]);
        this.joinedUniqueUsers = ko.pureComputed(() => _.uniq(this.joinedUsers()));

        this.activities = ko.observableArray();

        this.searchQuery = ko.observable();
        this.searchQuery.subscribe(_.debounce(this.searchTasks.bind(this), 500));
        this.searchHitTaskNum = ko.observable(null);

        this._searchHitTaskNumFormat = ko.observable(null);
        this.searchHitTaskNumFormat = ko.pureComputed({
            read: () => this._searchHitTaskNumFormat(),
            write: v => this._searchHitTaskNumFormat(v)
        });
        this.searchHitTaskNum.subscribe((delayReset => num => {
            if (num === null) {
                this.searchHitTaskNumFormat(null);
            } else {
                this.searchHitTaskNumFormat(num ? `Hit ${num} tasks` : 'No hit task');
                delayReset();
            }
        })(_.debounce(() => this.searchHitTaskNumFormat(null), 2000)));

        this.viewMode = ko.observable(localStorage.getItem('viewMode')); // full or compact
        this.viewMode.subscribe(val => localStorage.setItem('viewMode', val));

        this.project = project;
        this.users = project.users;
        this.tasks = project.tasks;
        this.labels = project.labels;
        this.stages = project.stages;
        this.stats = new ProjectStats({project});

        this.loginUser = ko.pureComputed(() => this.users().find(user => user.username() === global.username));

        this.canAssignUsers = ko.pureComputed(() => this.users().filter(user => !user.isWipLimited()));

        this.selectedTask = ko.observable();
        this.selectedUser = ko.observable();

        this.socket = null;
        this.socketSerializer = null;
        this.initSocket();

        this.initModals();
    }

    initSocket () {
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

    initModals () {
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
                updateParams: {
                    userId: user.id(),
                    stageId: this.stages().find(x => x.name() === 'todo').id()
                }
            }));
        });
        this.selectedTask.subscribe(x => this.assignTaskModal.task(x));
        this.assignTaskModal.register();

        // archiveTaskModal
        this.archiveTaskModal = new ArchiveTaskModal({project: this.project});
        this.archiveTaskModal.on('archive', ({task}) => {
            this.socket.emit('archiveTask', {taskId: task.id()});
        });
        this.selectedTask.subscribe(x => this.archiveTaskModal.task(x));
        this.archiveTaskModal.register();

        // removeUserModal
        this.removeUserModal = new RemoveUserModal({project: this.project});
        this.removeUserModal.on('remove', ({user}) => {
            this.socket.emit('removeUser', {username: user.username()});
        });
        this.selectedUser.subscribe(x => this.removeUserModal.user(x));
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
            this.removeUserModal.user(user);
            this.userSettingsModal.hideModal();
            this.removeUserModal.showModal();
        });
        this.userSettingsModal.on('update', ({user, wipLimit}) => {
            this.socket.emit('updateUser', {
                username: user.username(),
                updateParams: {wipLimit}
            });
        });
        this.selectedUser.subscribe(x => this.userSettingsModal.user(x));
        this.userSettingsModal.register();

        // archiveAllTaskModal
        this.archiveAllTaskModal = new ArchiveAllTaskModal({project: this.project});
        this.archiveAllTaskModal.on('archiveAll', () => {
            this.project.getTasks({stageOrWhere: {name: 'done'}})().forEach(task => {
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
                });
            });
            detachLabels.forEach(label => {
                this.socket.emit('detachLabel', {
                    taskId: task.id(),
                    labelId: label.id()
                });
            });
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
        this.taskCardList.on('updateTaskStatusAndOrder', ({task, beforeTask, stage, user}) => {
            this.socket.emit('updateTaskStatusAndOrder', {
                taskId: task.id(),
                beforeTaskId: beforeTask ? beforeTask.id() : null,
                updateParams: {
                    stageId: stage && stage.id(),
                    userId: user && user.id()
                }
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
        this.taskCardMiniMenu.on('clickTaskDetail', ({task}) => {
            this.selectedTask(task);
            this.taskDetailModal.showModal();
        });
        this.taskCardMiniMenu.on('clickTaskArchive', ({task}) => {
            this.selectedTask(task);
            this.archiveTaskModal.showModal();
        });
        this.taskCardMiniMenu.on('clickTaskAssign', ({task}) => {
            this.selectedTask(task);
            this.assignTaskModal.showModal();
        });
        this.taskCardMiniMenu.on('clickTaskPrevStage', ({task}) => {
            const stages = this.stages();
            const stage = task.stage();
            const pos = stages.indexOf(stage);
            if (!pos) { throw new Error(`cannot move to prev stage from ${stage.name()}`); }

            const prevStage = stages[pos - 1];
            const user = ko.unwrap(task.user);
            this.socket.emit('updateTaskStatus', ({
                taskId: task.id(),
                updateParams: {
                    userId: (prevStage.assigned() && user) ? user.id() : null,
                    stageId: prevStage.id()
                }
            }));
        });
        this.taskCardMiniMenu.on('clickTaskNextStage', ({task}) => {
            const stages = this.stages();
            const stage = task.stage();
            const pos = stages.indexOf(stage);
            if (pos + 1 > stages.length) { throw new Error(`cannot move to next stage from ${stage.name()}`); }

            const nextStage = stages[pos + 1];
            const user = ko.unwrap(task.user);
            this.socket.emit('updateTaskStatus', ({
                taskId: task.id(),
                updateParams: {
                    userId: (nextStage.assigned() && user) ? user.id() : null,
                    stageId: nextStage.id()
                }
            }));
        });
    }

    // TODO: move to TaskCardList
    onBeforeMoveDrag (arg) {
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

    searchTasks (searchQuery = '') {
        if (searchQuery) { // search
            const query = new TaskSearchQuery(searchQuery);
            const userHasTask = {};
            let hitNum = 0;

            this.users().forEach(user => {
                userHasTask[user.username()] = false;
            });

            this.tasks().forEach(task => {
                const text = task.textForSearch();
                const hit = query.hit(text);
                task.isVisible(hit);
                const assignee = task.user();
                if (assignee) {
                    userHasTask[assignee.username()] |= hit;
                }
                if (hit) {
                    hitNum += 1;
                }
            });

            this.users().forEach(user => {
                user.hasSearchTask(userHasTask[user.username()] || false);
            });

            this.searchHitTaskNum(hitNum);
            this.searchHitTaskNum.notifySubscribers(hitNum);
        } else { // all visible
            this.tasks().forEach(task => task.isVisible(true));
            this.users().forEach(user => user.hasSearchTask(true));
            this.searchHitTaskNum(null);
        }
    }

    addActivity (activity) {
        this.activities.push(new Activity(activity));
    }
}

module.exports = Kanban;
