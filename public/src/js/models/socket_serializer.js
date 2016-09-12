'use strict';
const _ = require('lodash');

// socketのonイベントをlocalのカンバンに適用するクラス
class SocketSerializer {
    constructor({socket, project, kanban}) {
        this.project = project;
        this.socket = socket;
        this.kanban = kanban;
        this.bindOnEvents();
    }

    bindOnEvents() {
        SocketSerializer.socketOnEventsKeys.forEach(key => {
            const method = 'on' + _.upperFirst(key);
            this.socket.on(key, params => this[method](params));
        });
    }

    /*** on events ***/

    onNotifyText({text}) {
        this.kanban.activitiesTexts.push(text);
    }

    onJoinRoom({username}) {
        const user = this.project.getUser({username});
        const joinedUsers = this.kanban.joinedUsers();
        if (!_.includes(joinedUsers, user)) {
            this.kanban.joinedUsers.push(user);
        }
    }

    onLeaveRoom({username}) {
        const user = this.project.getUser({username});
        const joinedUsers = this.kanban.joinedUsers();
        if (_.includes(joinedUsers, user)) {
            this.kanban.joinedUsers.remove(user);
        }
    }

    onInitJoinedUsernames({joinedUsernames}) {
        const users = joinedUsernames.map(({username}) => this.project.getUser({username}));
        this.kanban.joinedUsers(users)
    }

    onActivityHistory({activities}) {
        _.reverse(activities).forEach(x => this.kanban.activitiesTexts.push(x.text));
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
        this.project.updateUserOrder({username}, beforeUsername && {username: beforeUsername});
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
        this.project.attachLabel({id: task.id}, {id: label.id});
    }

    onDetachLabel({task, label}) {
        this.project.detachLabel({id: task.id}, {id: label.id});
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

module.exports = SocketSerializer;
