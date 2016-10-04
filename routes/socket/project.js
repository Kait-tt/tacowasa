const _ = require('lodash');
const co = require('co');
const db = require('../../lib/schemes');
const Member = require('../../lib/models/member');
const Task = require('../../lib/models/task');
const Stage = require('../../lib/models/stage');
const Label = require('../../lib/models/label');
const Activity = require('../../lib/models/activity');
const addon = require('../../addons');

class SocketProject {
    constructor (io, projectId) {
        this.projectId = projectId;
        this.users = {};
        this.io = io;
    }

    emits (user, key, params) {
        addon.callAddons('SocketEmit', key, {projectId: this.projectId, user, params, socketProject: this})
            .then(({params}) => this.io.to(this.projectId).emit(key, params))
            .catch(err => console.error(err));
    }

    joinProjectRoom (user) {
        const that = this;
        return co(function* () {
            that.users[user.id] = user;
            that.bindSocketUser(user);
            yield that.sendInitActivityLogs(user);
            yield that.sendInitJoinedUsers(user);
            yield that.joinRoom(user);
        }).catch(err => console.error(err));
    }

    leaveProjectRoom (user) {
        return this.leaveRoom(user);
    }

    bindSocketUser (user) {
        SocketProject.socketEventKeys.forEach(key => {
            user.socket.on(key, req => this[key](user, req)
                .catch(err => {
                    user.socket.emit('operationError', {error: err, message: err.message});
                    console.error(err);
                }));
        });
        addon.callAddons('SocketOn', 'register', {socketProject: this, user});
    }

    sendInitJoinedUsers (user) {
        user.socket.emit('initJoinedUsernames', {joinedUsernames: this.joinedUsernames});
        return Promise.resolve();
    }

    sendInitActivityLogs (user) {
        return Activity.findActivities(this.projectId)
            .then(xs => user.socket.emit('activityHistory', {activities: xs}));
    }

    // / events

    notifyText (user, text) {
        return Activity.add(this.projectId, user ? user.username : null, text)
            .then(x => this.emits(user, 'notifyText', x));
    }

    joinRoom (user) {
        return this.logging(user.username, 'joinRoom', {username: user.username})
            .then(() => {
                this.emits(user, 'joinRoom', {username: user.username});
                return this.notifyText(user, 'joined room');
            });
    }

    leaveRoom (user) {
        return this.logging(user.username, 'leaveRoom', {username: user.username})
            .then(() => {
                this.emits(user, 'leaveRoom', {username: user.username});
                return this.notifyText(user, 'left room');
            });
    }

    addUser (user, {username}) {
        const that = this;
        return co(function* () {
            const addedUser = yield Member.add(that.projectId, username);
            yield that.logging(user.username, 'addUser', {user: addedUser});
            that.emits(user, 'addUser', {username, user: addedUser});
            return yield that.notifyText(user, `added user: "${username}"`);
        });
    }

    removeUser (user, {username}) {
        const that = this;
        return co(function* () {
            const removedUser = yield Member.remove(that.projectId, username);
            yield that.logging(user.username, 'removeUser', {user: removedUser});
            that.emits(user, 'removeUser', {username});
            return that.notifyText(user, `removed user: "${username}"`);
        });
    }

    updateUser (user, {username, updateParams}) {
        const that = this;
        return co(function* () {
            const updatedUser = yield Member.update(that.projectId, username, updateParams);
            yield that.logging(user.username, '', {user: updatedUser});
            that.emits(user, 'updateUser', {username, user: updatedUser});
            return yield that.notifyText(user, `updated user: "${username}"`);
        });
    }

    updateUserOrder (user, {username, beforeUsername}) {
        const that = this;
        return co(function* () {
            const res = yield Member.updateOrder(that.projectId, username, beforeUsername);
            yield that.logging(user.username, 'updateUserOrder', res);
            that.emits(user, 'updateUserOrder', {username, beforeUsername});
            return that.notifyText(user, `update user order: insert ${username} before ${beforeUsername}`);
        });
    }

    createTask (user, taskParams) {
        const that = this;
        return co(function* () {
            const newTask = yield Task.create(that.projectId, taskParams);
            yield that.logging(user.username, 'createTask', {task: newTask});
            that.emits(user, 'createTask', {task: newTask});
            return yield that.notifyText(user, `created new task: ${newTask.title}`);
        });
    }

    archiveTask (user, {taskId}) {
        const that = this;
        return co(function* () {
            const archivedTask = yield Task.archive(that.projectId, taskId);
            yield that.logging(user.username, 'archiveTask', {task: archivedTask});
            that.emits(user, 'archiveTask', {task: archivedTask});
            return yield that.notifyText(user, `archived task: ${archivedTask.title}`);
        });
    }

    updateTaskStatus (user, {taskId, updateParams: {userId, stageId}}) {
        const that = this;
        return co(function* () {
            const updatedTask = yield Task.updateStatus(that.projectId, taskId, {userId, stageId});
            const assignedUser = userId && (yield Member.findByUserId(that.projectId, userId));
            const assignedUsername = assignedUser && assignedUser.username;
            const stage = yield Stage.findById(that.projectId, stageId);
            yield that.logging(user.username, 'updateTaskStatus', {task: updatedTask});
            that.emits(user, 'updateTaskStatus', {task: updatedTask});
            return yield that.notifyText(user, `updatedTask: {task: ${updatedTask.title}, username: ${assignedUsername}, stage: ${stage.name}`);
        });
    }

    updateTaskContent (user, {taskId, updateParams: {title, body, costId}}) {
        const that = this;
        return co(function* () {
            const updatedTask = yield Task.updateContent(that.projectId, taskId, {title, body, costId});
            yield that.logging(user.username, 'updateTaskContent', {task: updatedTask});
            that.emits(user, 'updateTaskContent', {task: updatedTask});
            return yield that.notifyText(user, `updateTask: {task: ${updatedTask.title}}`);
        });
    }

    updateTaskWorkingState (user, {taskId, isWorking}) {
        const that = this;
        return co(function* () {
            const task = yield Task.updateWorkingState(that.projectId, taskId, isWorking);
            yield that.logging(user.username, '', {task});
            that.emits(user, 'updateTaskWorkingState', {task, isWorking});
            return yield that.notifyText(user, `${isWorking ? 'start' : 'stop'} to work: ${task.title}`);
        });
    }

    updateTaskWorkHistory (user, {taskId, works}) {
        const that = this;
        return co(function* () {
            const task = yield Task.updateWorkHistory(that.projectId, taskId, works);
            yield that.logging(user.username, '', {});
            that.emits(user, 'updateTaskWorkHistory', {task, works: task.works});
            return yield that.notifyText(user, `updated work history: ${task.title}`);
        });
    }

    updateTaskOrder (user, {taskId, beforeTaskId}) {
        const that = this;
        return co(function* () {
            const {task, beforeTask, updated} = yield Task.updateOrder(that.projectId, taskId, beforeTaskId);
            if (!updated) { return Promise.resolve(); }
            yield that.logging(user.username, '', {});
            that.emits(user, 'updateTaskOrder', {task, beforeTask});
            return yield that.notifyText(user, `update task order: insert ${task.title} before ${beforeTask ? beforeTask.title : null}`);
        });
    }

    updateTaskStatusAndOrder (user, {taskId, beforeTaskId, updateParams: {userId, stageId}}) {
        const that = this;
        return co(function* () {
            const {task: updatedTask, beforeTask, updatedOrder} = yield Task.updateStatusAndOrder(that.projectId, taskId, beforeTaskId, {userId, stageId});
            const assignedUser = userId && (yield Member.findByUserId(that.projectId, userId));
            const assignedUsername = assignedUser && assignedUser.username;
            const stage = yield Stage.findById(that.projectId, stageId);
            const beforeTaskTitle = beforeTask ? beforeTask.title : null;
            if (updatedOrder) {
                yield that.logging(user.username, 'updateTaskStatusAndOrder', {task: updatedTask, beforeTask});
                that.emits(user, 'updateTaskStatusAndOrder', {task: updatedTask, beforeTask});
                return yield that.notifyText(user, `updatedTask: {task: ${updatedTask.title}, username: ${assignedUsername}, stage: ${stage.name}, before: ${beforeTaskTitle}`);
            } else {
                yield that.logging(user.username, 'updateTaskStatus', {task: updatedTask});
                that.emits(user, 'updateTaskStatus', {task: updatedTask});
                return yield that.notifyText(user, `updatedTask: {task: ${updatedTask.title}, username: ${assignedUsername}, stage: ${stage.name}`);
            }
        });
    }

    attachLabel (user, {taskId, labelId}) {
        const that = this;
        return co(function* () {
            const {task, label} = yield Label.attach(that.projectId, labelId, taskId);
            yield that.logging(user.username, 'attachLabel', {task, label});
            that.emits(user, 'attachLabel', {task, label});
            return yield that.notifyText(user, `attached label: {label: ${label.name}, task: ${task.name}}`);
        });
    }

    detachLabel (user, {taskId, labelId}) {
        const that = this;
        return co(function* () {
            const {task, label} = yield Label.detach(that.projectId, labelId, taskId);
            yield that.logging(user.username, 'detachLabel', {task, label});
            that.emits(user, 'detachLabel', {task, label});
            return yield that.notifyText(user, `detached label: {label: ${label.name}, task: ${task.name}}`);
        });
    }

    logging (username, action, content = {}) {
        return db.Log.create({projectId: this.projectId, action, content: JSON.stringify(_.defaults(content, {operator: username}))});
    }

    get joinedUsernames () {
        return _.chain(this.users)
            .values()
            .filter({projectId: this.projectId, active: true})
            .map('username')
            .compact()
            .uniq()
            .value();
    }

    static get socketEventKeys () {
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
            'updateTaskStatusAndOrder',
            'attachLabel',
            'detachLabel'
        ];
    }
}

module.exports = SocketProject;
