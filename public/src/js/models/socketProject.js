'use strict';
const _ = require('lodash');

class SocketProject {
    constructor({project, socket, kanban}) {
        this.project = project;
        this.socket = socket;
        this.kanban = kanban;
        this.bindOnEvents();
    }

    bindOnEvents() {
        SocketProject.socketOnEventsKeys.forEach(key => {
            const method = 'on' + _.upperFirst(key);
            this.socket.on(key, params => this[method](params));
        });
    }

    onNotifyText() {
        // TODO: ...
    }

    onJoinRoom({username}) {
        // TODO: onJoinRoom
    }

    onLeaveRoom({username}) {
        // TODO: onLeaveRoom
    }

    onInitJoinedUsernames({joinedUsernames}) {
        // TODO: this.kanban.joinedUsers(..)
    }

    onActivityHistory(params) {
        // TODO: onActivityHistory
    }

    onAddUser({username, user}) {
        this.project.addUser(user);
    }

    onRemoveUser({username}) {
        this.project.removeUser({username});
    }

    onUpdateUser({username, user}) {
        this.project.updateUser({username}, _.assign({}, user, user.member));
    }

    onUpdateUserOrder({username, beforeUsername}) {
        this.project.updateUserOrder({username}, {username: beforeUsername});
    }

    onCreateTask({task}) {
        this.project.addTask(task);
    }

    onArchiveTask({task}) {
        this.project.archiveTask({id: task.id});
    }

    onUpdateTaskStatus({task}) {
        this.project.updateTaskStatus({id: task.id}, {id: task.stage.id}, task.user && {id: task.user.id});
    }

    onUpdateTaskContent({task}) {
        this.project.updateTaskContent({id: task.id}, task.title, task.body, {id: task.cost.id})
    }

    onUpdateTaskWorkingState({task, isWorking}) {
        this.project.updateTaskWorkingState({id: task.id}, isWorking);
    }

    onUpdateTaskWorkHistory({task, works}) {
        this.project.updateWorkHistory({id: task.id}, works);
    }

    onUpdateTaskOrder({task, beforeTask}) {
        this.project.updateTaskOrder({id: task.id}, {id: beforeTask.id});
    }

    onAttachLabel({task, label}) {
        this.attachLabel({id: task.id}, {id: label.id});
    }

    onDetachLabel({task, label}) {
        this.detachLabel({id: task.id}, {id: label.id});
    }


    static get socketOnEventsKeys() {
        return [
            'notifyText',
            'joinRoom',
            'leaveRoom',
            'initJoinedUsernames',
            'activityHistory',
            'addUser',
            'removeUser',
            'updateUser',
            'updateUserOrder',
            'createTask',
            'archiveTask',
            'updateTaskStatus',
            'updateTaskContent',
            'updateTaskWorkingState',
            'updateTaskWorkHistory',
            'updateTaskOrder',
            'attachLabel',
            'detachLabel'
        ];
    }
}

module.exports = SocketProject;
