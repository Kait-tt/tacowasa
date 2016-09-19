const _ = require('lodash');
const co = require('co');
const Member = require('../../lib/models/member');
const Task = require('../../lib/models/task');
const Stage = require('../../lib/models/stage');
const Label = require('../../lib/models/label');
const Activity = require('../../lib/models/activity');
const addon = require('../../addons');

class SocketProject {
    constructor(io, projectId) {
        this.projectId = projectId;
        this.users = {};
        this.io = io;
    }

    emits(user, key, params) {
        addon.callAddons('SocketEmit', key, {projectId: this.projectId, user, params, socketProject: this})
            .then(({params}) => this.io.to(this.projectId).emit(key, params))
            .catch(err => console.error(err));
    }

    joinProjectRoom(user) {
        const that = this;
        return co(function* () {
            that.users[user.id] = user;

            yield that.sendInitActivityLogs(user);
            yield that.sendInitJoinedUsers(user);
            yield that.joinRoom(user);
            that.bindSocketUser(user);
        }).catch(err => console.error(err));
    }

    leaveProjectRoom(user) {
        return this.leaveRoom(user);
    }

    bindSocketUser(user) {
        SocketProject.socketEventKeys.forEach(key => {
            user.socket.on(key, req => {
                addon.callAddons('SocketOn', key, {projectId: this.projectId, user, req, socketProject: this})
                    .then(({req}) => {
                        this[key](user, req)
                            .catch(err => {
                                user.socket.emit('operationError', {error: err, message: err.message});
                                console.error(err);
                            });
                    });
            });
        });
    }

    sendInitJoinedUsers(user) {
        return Promise.resolve(() => {
            const joinedUsernames = _.chain(this.users)
                .values()
                .where({projectId: this.projectId, active: true})
                .map('username')
                .compact()
                .uniq()
                .filter(x => x !== user.username)
                .value();

            user.socket.emit('initJoinedUesrnames', {joinedUsernames});
        });
    }

    sendInitActivityLogs(user) {
        return Activity.findActivities(this.projectId)
            .then(xs => user.socket.emit('activityHistory', {activities : xs}));
    }

    /// events

    notifyText(user, text) {
        return Activity.add(this.projectId, user ? user.username : null, text)
            .then(x => this.emits(user, 'notifyText', x));
    }

    joinRoom(user) {
        this.emits(user, 'joinRoom', {username: user.username});
        return this.notifyText(user, 'joined room');
    }

    leaveRoom(user) {
        this.emits(user, 'leaveRoom', {username: user.username});
        return this.notifyText(user, 'left room');
    }

    addUser(user, {username}) {
        return Member.add(this.projectId, username)
            .then(addedUser => {
                this.emits(user, 'addUser', {username, user: addedUser});
                return this.notifyText(user, `added user: "${username}"`);
            });
    }

    removeUser(user, {username}) {
        return Member.remove(this.projectId, username)
            .then(() => {
                this.emits(user, 'removeUser', {username});
                return this.notifyText(user, `removed user: "${username}"`);
            });
    }

    updateUser(user, {username, updateParams}) {
        return Member.update(this.projectId, username, updateParams)
            .then(updatedUser => {
                this.emits(user, 'updateUser', {username, user: updatedUser});
                return this.notifyText(user, `updated user: "${username}"`);
            });
    }

    updateUserOrder(user, {username, beforeUsername}) {
        return Member.updateOrder(this.projectId, username, beforeUsername)
            .then(() => {
                this.emits(user, 'updateUserOrder', {username, beforeUsername});
                return this.notifyText(user, `update user order: insert ${username} before ${beforeUsername}`);
            });
    }

    createTask(user, taskParams) {
        return Task.create(this.projectId, taskParams)
            .then(newTask => {
                this.emits(user, 'createTask', {task: newTask});
                return this.notifyText(user, `created new task: ${newTask.title}`);
            });
    }

    archiveTask(user, {taskId}) {
        return Task.archive(this.projectId, taskId)
            .then(archivedTask => {
                this.emits(user, 'archiveTask', {task: archivedTask});
                return this.notifyText(user, `archived task: ${archivedTask.title}`);
            });
    }

    updateTaskStatus(user, {taskId, updateParams: {userId, stageId}}) {
        const that = this;
        return co(function* () {
            const updatedTask = yield Task.updateStatus(that.projectId, taskId, {userId, stageId});
            const assignedUser = userId && (yield Member.findByUserId(that.projectId, userId));
            const assignedUsername = assignedUser && assignedUser.username;
            const stage = yield Stage.findById(that.projectId, stageId);
            that.emits(user, 'updateTaskStatus', {task: updatedTask});
            return yield that.notifyText(user, `updatedTask: {task: ${updatedTask.title}, username: ${assignedUsername}, stage: ${stage.name}`)
        });
    }

    updateTaskContent(user, {taskId, updateParams: {title, body, costId}}) {
        return Task.updateContent(this.projectId, taskId, {title, body, costId})
            .then(updatedTask => {
                this.emits(user, 'updateTaskContent', {task: updatedTask});
                return this.notifyText(user, `updateTask: {task: ${updatedTask.title}`);
            });
    }

    updateTaskWorkingState(user, {taskId, isWorking}) {
        return Task.updateWorkingState(this.projectId, taskId, isWorking)
            .then(task => {
                this.emits(user, 'updateTaskWorkingState', {task, isWorking});
                return this.notifyText(user, `${isWorking ? 'start' : 'stop'} to work: ${task.title}`);
            });
    }

    updateTaskWorkHistory(user, {taskId, works}) {
        return Task.updateWorkHistory(this.projectId, taskId, works)
            .then(task => {
                this.emits(user, 'updateTaskWorkHistory', {task, works: task.works});
                return this.notifyText(user, `updated work history: ${task.title}`);
            });
    }

    updateTaskOrder(user, {taskId, beforeTaskId}) {
        return Task.updateOrder(this.projectId, taskId, beforeTaskId)
            .then(({task, beforeTask, updated}) => {
                if (!updated) { return Promise.resolve(); }
                this.emits(user, 'updateTaskOrder', {task, beforeTask});
                return this.notifyText(user, `update task order: insert ${task.title} before ${beforeTask ? beforeTask.title : null}`);
            });
    }

    attachLabel(user, {taskId, labelId}) {
        return Label.attach(this.projectId, labelId, taskId)
            .then(({task, label}) => {
                this.emits(user, 'attachLabel', {task, label});
                return this.notifyText(user, `attached label: {label: ${label.name}, task: ${task.name}}`);
            });
    }

    detachLabel(user, {taskId, labelId}) {
        return Label.detach(this.projectId, labelId, taskId)
            .then(({task, label}) => {
                this.emits(user, 'detachLabel', {task, label});
                return this.notifyText(user, `detached label: {label: ${label.name}, task: ${task.name}}`);
            });
    }

    static get socketEventKeys() {
        return [
            'joinRoom',
            'leaveRoom',
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