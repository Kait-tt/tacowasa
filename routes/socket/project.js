const _ = require('lodash');
const co = require('co');
const Member = require('../../lib/models/member');
const Task = require('../../lib/models/task');
const Stage = require('../../lib/models/stage');
const Label = require('../../lib/models/label');

class SocketProject {
    constructor(io, projectId) {
        this.projectId = projectId;
        this.users = {};
        this.io = io;
    }

    emits(key, params) {
        this.io.to(this.projectId).emit(key, params);
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
        this.leaveRoom(user);
    }

    bindSocketUser(user) {
        SocketProject.socketEventKeys.forEach(key => {
            user.socket.on(key, req => {
                this[key](user, req)
                    .catch(err => {
                        user.socket.emit('operationError', {error: err, message: err.message});
                        console.error(err);
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
        // TODO: this is stub
        return Promise.resolve(() => {
            user.socket.emit('activityHistory', {});
        });
    }

    /// events

    notifyText(username, text) {
        // TODO: this is stub
        return Promise.resolve();
    }

    joinRoom(user) {
        this.emits('joinRoom', {username: user.username});
        return this.notifyText(user.username, 'joined room');
    }

    leaveRoom(user) {
        this.emits('leaveRoom', {username: user.username});
        return this.notifyText(this.projectId, username, 'left room');
    }

    addUser(user, {username}) {
        return Member.add(this.projectId, username)
            .then(addedUser => {
                this.emits('addUser', {username, user: addedUser});
                return this.notifyText(user.username, `added user: "${username}"`);
            });
    }

    removeUser(user, {username}) {
        return Member.remove(this.projectId, username)
            .then(() => {
                this.emits('removeUser', {username});
                return this.notifyText(user.username, `removed user: "${username}"`);
            });
    }

    updateUser(user, {username, updateParams}) {
        return Member.update(this.projectId, username, updateParams)
            .then(updatedUser => {
                this.emits('updateUser', {username, user: updatedUser});
                return this.notifyText(user.username, `updated user: "${username}"`);
            });
    }

    updateUserOrder(user, {username, beforeUsername}) {
        return Member.updateOrder(this.projectId, username, beforeUsername)
            .then(() => {
                this.emits('updateUserOrder', {username, beforeUsername});
                return this.notifyText(user.username, `update user order: insert ${username} before ${beforeUsername}`);
            });
    }

    createTask(user, taskParams) {
        return Task.create(this.projectId, taskParams)
            .then(newTask => {
                this.emits('createTask', {task: newTask});
                return this.notifyText(user.username, `created new task: ${newTask.title}`);
            });
    }

    archiveTask(user, {taskId}) {
        return Task.archive(this.projectId, taskId)
            .then(archivedTask => {
                this.emits('archiveTask', {task: archivedTask});
                return this.notifyText(user.username, `archived task: ${archivedTask.title}`);
            });
    }

    updateTaskStatus(user, {taskId, updateParams: {userId, stageId}}) {
        const that = this;
        return co(function* () {
            const updatedTask = yield Task.updateStatus(that.projectId, taskId, {userId, stageId});
            const assignedUser = userId && (yield Member.findByUserId(that.projectId, userId));
            const assignedUsername = assignedUser && assignedUser.username;
            const stage = yield Stage.findById(projectId, stageId);
            that.emits('updateTaskStatus', {task: updatedTask});
            return yield that.notifyText(user.username, `updatedTask: {task: ${updatedTask.title}, username: ${assignedUsername}, stage: ${stage.name}`)
        });
    }

    updateTaskContent(user, {taskId, updateParams: {title, body, costId}}) {
        return Task.updateContent(this.projectId, taskId, {title, body, costId})
            .then(updatedTask => {
                this.emits('updateTaskContent', {task: updatedTask});
                return this.notifyText(user.username, `updateTask: {task: ${updatedTask.title}`);
            });
    }

    updateTaskWorkingState(user, {taskId, isWorking}) {
        return Task.updateWorkingState(this.projectId, taskId, isWorking)
            .then(task => {
                this.emits('updateTaskWorkingState', {task, isWorking});
                return this.notifyText(user.username, `${isWorking ? 'start' : 'stop'} to work: ${task.title}`);
            });
    }

    updateTaskWorkHistory(user, {taskId, works}) {
        return Task.updateWorkHistory(this.projectId, taskId, works)
            .then(task => {
                this.emits('updateTaskWorkHistory', {task, works});
                return this.notifyText(user.username, `updated work history: ${task.title}`);
            })
    }

    updateTaskOrder(user, {taskId, beforeTaskId}) {
        return Task.updateOrder(this.projectId, taskId, beforeTaskId)
            .then(({task, beforeTask}) => {
                this.emits('updateTaskOrder', {task, beforeTask});
                return this.notifyText(user.username, `update task order: insert ${taskId} before ${beforeTaskId}`);
            });
    }

    attachLabel(user, {taskId, labelId}) {
        return Label.attach(this.projectId, labelId, taskId)
            .then((task, label) => {
                this.emits('attachLabel', {task, label});
                return this.notifyText(user.username, `attached label: {label: ${label.name}, task: ${task.name}}`);
            });
    }

    detachLabel(user, {taskId, labelId}) {
        return Label.detach(this.projectId, labelId, taskId)
            .then((task, label) => {
                this.emits('detachLabel', {task, label});
                return this.notifyText(user.username, `detached label: {label: ${label.name}, task: ${task.name}}`);
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