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
        this.emits = this.io.to(this.projectId).emit.bind(this.io);
    }

    joinProjectRoom(user) {
        return co(function* () {
            this.users[user.id] = user;

            yield this.sendInitActivityLogs(user);
            yield this.sendInitJoinedUsers(user);
            yield this.joinRoom(user);
            this.bindSocketUser(user);
        }).catch(err => console.error(err));
    }

    leaveProjectRoom(user) {
        this.emitLeaveRoom(user);
    }

    bindSocketUser(user) {
        this.socketEventKeys.forEach(key => {
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

    joinRoom(user) {
        this.emits('joinRoom', {username: user.username});
        return this.notifyText(user.username, 'joined room');
    }

    emitLeaveRoom(user) {
        this.emits('leaveRoom', {username: user.username});
        return this.notifyText(projectId, username, 'left room');
    }

    notifyText(username, text) {
        // TODO: this is stub
        return Promise.resolve();
    }

    /// events

    addMember(user, {username}) {
        return Member.add(this.projectId, username)
            .then(addedUser => {
                this.emits('addMember', {username, user: addedUser});
                return this.notifyText(user.username, `added member: "${username}"`);
            });
    }

    removeMember(user, {username}) {
        return Member.remove(this.projectId, username)
            .then(() => {
                this.emits('removeMember', {username});
                return this.notifyText(user.username, `removed member: "${username}"`);
            });
    }

    updateMember(user, {username, updateParams}) {
        return Member.update(this.projectId, username, updateParams)
            .then(updatedUser => {
                this.emits('updateMember', {username, user: updatedUser});
                return this.notifyText(user.username, `updated member: "${username}"`);
            });
    }

    updateMemberOrder(user, {username, beforeUsername}) {
        return Member.updateOrder(this.projectId, username, beforeUsername)
            .then(() => {
                this.emits('updateMemberOrder', {username, beforeUsername});
                return this.notifyText(user.username, `update member order: insert ${username} before ${beforeUsername}`);
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
        return co(function* () {
            const updatedTask = yield Task.updateStatus(this.projectId, taskId, {userId, stageId});
            const assignedUser = userId && (yield Member.findByUserId(this.projectId, userId));
            const assignedUsername = assignedUser && assignedUser.username;
            const stage = yield Stage.findById(projectId, stageId);
            this.emits('updateTaskStatus', {task: updatedTask});
            return yield this.notifyText(user.username, `updatedTask: {task: ${updatedTask.title}, username: ${assignedUsername}, stage: ${stage.name}`)
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
                this.emits('updateTaskWorkingState', {taskId, task, isWorking});
                return this.notifyText(user.username, `${isWorking ? 'start' : 'stop'} to work: ${task.title}`);
            });
    }

    updateTaskWorkHistory(user, {taskId, works}) {
        return Task.updateWorkHistory(this.projectId, taskId, works)
            .then(task => {
                this.emits('updateTaskWorkHistory', {taskId, task, works});
                return this.notifyText(user.username, `updated work history: ${task.title}`);
            })
    }

    updateTaskOrder(user, {taskId, beforeTaskId}) {
        return Task.updateOrder(this.projectId, taskId, beforeTaskId)
            .then(task => {
                this.emits('updateTaskOrder', {taskId, beforeTaskId});
                return this.notifyText(user.username, `update task order: insert ${taskId} before ${beforeTaskId}`);
            });
    }

    attachLabel(user, {taskId, labelId}) {
        return Label.attach(this.projectId, labelId, taskId)
            .then((task, label) => {
                this.emits('attachLabel', {taskId, labelId, task, label});
                return this.notifyText(user.username, `attached label: {label: ${label.name}, task: ${task.name}}`);
            });
    }

    detachLabel(user, {taskId, labelId}) {
        return Label.detach(this.projectId, labelId, taskId)
            .then((task, label) => {
                this.emits('detachLabel', {taskId, labelId, task, label});
                return this.notifyText(user.username, `detached label: {label: ${label.name}, task: ${task.name}}`);
            });
    }

    get socketEventKeys() {
        return [
            'addMember',
            'removeMember',
            'updateMember',
            'updateMemberOrder',
            'createTask',
            'archiveTask',
            'updateTaskStatus',
            'updateTaskContent',
            'updateTaskWorkingState',
            'updateTaskWorkHistory',
            'updateTaskOrder',
            'attachLabel',
            'detachLabel'
        ]
    }
}

module.exports = SocketProject;