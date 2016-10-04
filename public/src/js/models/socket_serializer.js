'use strict';
const _ = require('lodash');

// socketのonイベントをlocalのカンバンに適用するクラス
class SocketSerializer {
    constructor ({socket, project, kanban}) {
        this.project = project;
        this.socket = socket;
        this.kanban = kanban;
        this.bindOnEvents();
    }

    bindOnEvents () {
        SocketSerializer.socketOnEventsKeys.forEach(key => {
            const method = 'on' + _.upperFirst(key);
            this.socket.on(key, params => this[method](params));
        });
    }

    /** * on events ***/

    onNotifyText (activity) {
        this.kanban.addActivity(activity);
    }

    onJoinRoom ({username}) {
        const user = this.project.getUser({username});
        this.kanban.joinedUsers.push(user);
    }

    onLeaveRoom ({username}) {
        const user = this.project.getUser({username});
        const joinedUsers = this.kanban.joinedUsers();
        const pos = joinedUsers.indexOf(user);
        if (pos !== -1) {
            joinedUsers.splice(pos, 1);
        }
    }

    onInitJoinedUsernames ({joinedUsernames}) {
        const users = joinedUsernames.map((username) => this.project.getUser({username}));
        this.kanban.joinedUsers(users);
    }

    onActivityHistory ({activities}) {
        activities.forEach(x => this.kanban.addActivity(x));
    }

    onAddUser ({username, user}) {
        this.project.addUser(user);
    }

    onRemoveUser ({username}) {
        this.project.removeUser({username});
    }

    onUpdateUser ({username, user}) {
        this.project.updateUser({username}, _.assign({}, user, user.member));
    }

    onUpdateUserOrder ({username, beforeUsername}) {
        this.project.updateUserOrder({username}, beforeUsername && {username: beforeUsername});
    }

    onCreateTask ({task}) {
        this.project.addTask(task);
    }

    onArchiveTask ({task}) {
        this.project.archiveTask({id: task.id});
    }

    onUpdateTaskStatus ({task}) {
        this.project.updateTaskStatus({id: task.id}, {id: task.stage.id}, task.user && {id: task.user.id});
    }

    onUpdateTaskContent ({task}) {
        this.project.updateTaskContent({id: task.id}, task.title, task.body, {id: task.cost.id});
    }

    onUpdateTaskWorkingState ({task, isWorking}) {
        this.project.updateTaskWorkingState({id: task.id}, isWorking);
        this.project.updateTaskWorkHistory({id: task.id}, task.works);
    }

    onUpdateTaskWorkHistory ({task, works}) {
        this.project.updateTaskWorkHistory({id: task.id}, works);
    }

    onUpdateTaskOrder ({task, beforeTask}) {
        this.project.updateTaskOrder({id: task.id}, beforeTask && {id: beforeTask.id});
    }

    onUpdateTaskStatusAndOrder ({task, beforeTask}) {
        this.project.updateTaskStatus({id: task.id}, {id: task.stage.id}, task.user && {id: task.user.id});
        this.project.updateTaskOrder({id: task.id}, beforeTask && {id: beforeTask.id});
    }

    onAttachLabel ({task, label}) {
        this.project.attachLabel({id: task.id}, {id: label.id});
    }

    onDetachLabel ({task, label}) {
        this.project.detachLabel({id: task.id}, {id: label.id});
    }

    onAddLabel ({label}) {
        this.project.addLabel(label);
    }

    static get socketOnEventsKeys () {
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
            'updateTaskStatusAndOrder',
            'attachLabel',
            'detachLabel',
            'addLabel',
            'addonSocketTest'
        ];
    }
}

module.exports = SocketSerializer;
