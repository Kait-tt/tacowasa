const _ = require('lodash');
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

    async joinProjectRoom (user) {
        this.users[user.id] = user;
        this.bindSocketUser(user);
        await this.sendInitActivityLogs(user);
        await this.sendInitJoinedUsers(user);
        await this.joinRoom(user);
    }

    async leaveProjectRoom (user) {
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
        addon.callAddons('SocketOn', 'register', {socketProject: this, user}, {sync: true});
    }

    async sendInitJoinedUsers (user) {
        user.socket.emit('initJoinedUsernames', {joinedUsernames: this.joinedUsernames});
    }

    async sendInitActivityLogs (user) {
        const activities = await Activity.findActivities(this.projectId);
        user.socket.emit('activityHistory', {activities});
    }

    // / events

    async notifyText (user, text, {transaction} = {}) {
        const activity = await Activity.add(this.projectId, user ? user.username : null, text, {transaction});
        this.emits(user, 'notifyText', activity);
    }

    async joinRoom (user) {
        await this.logging(user.username, 'joinRoom', {username: user.username});
        this.emits(user, 'joinRoom', {username: user.username});
        // await this.notifyText(user, 'joined room');
    }

    async leaveRoom (user) {
        await this.logging(user.username, 'leaveRoom', {username: user.username});
        this.emits(user, 'leaveRoom', {username: user.username});
        // await this.notifyText(user, 'left room');
    }

    async addUser (user, {username}) {
        const addedUser = await Member.add(this.projectId, username);
        await this.logging(user.username, 'addUser', {user: addedUser});
        this.emits(user, 'addUser', {username, user: addedUser});
        await this.notifyText(user, `added user: "${username}"`);
    }

    async removeUser (user, {username}) {
        const removedUser = await Member.remove(this.projectId, username);
        await this.logging(user.username, 'removeUser', {user: removedUser});
        this.emits(user, 'removeUser', {username});
        await this.notifyText(user, `removed user: "${username}"`);
    }

    async updateUser (user, {username, updateParams}) {
        const updatedUser = await Member.update(this.projectId, username, updateParams);
        await this.logging(user.username, 'updatedUser', {user: updatedUser});
        this.emits(user, 'updateUser', {username, user: updatedUser});
        await this.notifyText(user, `updated user: "${username}"`);
    }

    async updateUserOrder (user, {username, beforeUsername}) {
        const res = await Member.updateOrder(this.projectId, username, beforeUsername);
        await this.logging(user.username, 'updateUserOrder', res);
        this.emits(user, 'updateUserOrder', {username, beforeUsername});
        await this.notifyText(user, `update user order: insert ${username} before ${beforeUsername}`);
    }

    async createTask (user, taskParams) {
        const newTask = await Task.create(this.projectId, taskParams);
        await this.logging(user.username, 'createTask', {task: newTask});
        this.emits(user, 'createTask', {task: newTask});
        return await this.notifyText(user, `created new task: ${newTask.title}`);
    }

    async archiveTask (user, {taskId}) {
        const archivedTask = await Task.archive(this.projectId, taskId);
        await this.logging(user.username, 'archiveTask', {task: archivedTask});
        this.emits(user, 'archiveTask', {task: archivedTask});
        return await this.notifyText(user, `archived task: ${archivedTask.title}`);
    }

    async updateTaskStatus (user, {taskId, updateParams: {userId, stageId}}) {
        const updatedTask = await Task.updateStatus(this.projectId, taskId, {userId, stageId});
        const assignedUser = userId && (await Member.findByUserId(this.projectId, userId));
        const assignedUsername = assignedUser && assignedUser.username;
        const stage = await Stage.findById(this.projectId, stageId);
        await this.logging(user.username, 'updateTaskStatus', {task: updatedTask});
        this.emits(user, 'updateTaskStatus', {task: updatedTask});
        return await this.notifyText(user, `updatedTask: {task: ${updatedTask.title}, username: ${assignedUsername}, stage: ${stage.name}`);
    }

    async updateTaskContent (user, {taskId, updateParams: {title, body, costId}}) {
        const updatedTask = await Task.updateContent(this.projectId, taskId, {title, body, costId});
        await this.logging(user.username, 'updateTaskContent', {task: updatedTask});
        this.emits(user, 'updateTaskContent', {task: updatedTask});
        return await this.notifyText(user, `updateTask: {task: ${updatedTask.title}}`);
    }

    async updateTaskWorkingState (user, {taskId, isWorking}) {
        const task = await Task.updateWorkingState(this.projectId, taskId, isWorking);
        await this.logging(user.username, 'updateTaskWorkingState', {task});
        this.emits(user, 'updateTaskWorkingState', {task, isWorking});
        return await this.notifyText(user, `${isWorking ? 'start' : 'stop'} to work: ${task.title}`);
    }

    async updateTaskWorkHistory (user, {taskId, works}) {
        const task = await Task.updateWorkHistory(this.projectId, taskId, works);
        await this.logging(user.username, 'updateTaskWorkHistory', {});
        this.emits(user, 'updateTaskWorkHistory', {task, works: task.works});
        return await this.notifyText(user, `updated work history: ${task.title}`);
    }

    async updateTaskOrder (user, {taskId, beforeTaskId}) {
        const {task, beforeTask, updated} = await Task.updateOrder(this.projectId, taskId, beforeTaskId);
        if (!updated) { return Promise.resolve(); }
        await this.logging(user.username, 'updateTaskOrder', {});
        this.emits(user, 'updateTaskOrder', {task, beforeTask});
        return await this.notifyText(user, `update task order: insert ${task.title} before ${beforeTask ? beforeTask.title : null}`);
    }

    async updateTaskStatusAndOrder (user, {taskId, beforeTaskId, updateParams: {userId, stageId}}) {
        const {task: updatedTask, beforeTask, updatedOrder} = await Task.updateStatusAndOrder(this.projectId, taskId, beforeTaskId, {userId, stageId});
        const assignedUser = userId && (await Member.findByUserId(this.projectId, userId));
        const assignedUsername = assignedUser && assignedUser.username;
        const stage = await Stage.findById(this.projectId, stageId);
        const beforeTaskTitle = beforeTask ? beforeTask.title : null;
        if (updatedOrder) {
            await this.logging(user.username, 'updateTaskStatusAndOrder', {task: updatedTask, beforeTask});
            this.emits(user, 'updateTaskStatusAndOrder', {task: updatedTask, beforeTask});
            return await this.notifyText(user, `updatedTask: {task: ${updatedTask.title}, username: ${assignedUsername}, stage: ${stage.name}, before: ${beforeTaskTitle}`);
        } else {
            await this.logging(user.username, 'updateTaskStatus', {task: updatedTask});
            this.emits(user, 'updateTaskStatus', {task: updatedTask});
            return await this.notifyText(user, `updatedTask: {task: ${updatedTask.title}, username: ${assignedUsername}, stage: ${stage.name}`);
        }
    }

    async attachLabel (user, {taskId, labelId}) {
        const {task, label} = await Label.attach(this.projectId, labelId, taskId);
        await this.logging(user.username, 'attachLabel', {task, label});
        this.emits(user, 'attachLabel', {task, label});
        return await this.notifyText(user, `attached label: {label: ${label.name}, task: ${task.name}}`);
    }

    async detachLabel (user, {taskId, labelId}) {
        const {task, label} = await Label.detach(this.projectId, labelId, taskId);
        await this.logging(user.username, 'detachLabel', {task, label});
        this.emits(user, 'detachLabel', {task, label});
        return await this.notifyText(user, `detached label: {label: ${label.name}, task: ${task.name}}`);
    }

    async logging (username, action, content = {}, {transaction} = {}) {
        return db.Log.create({projectId: this.projectId, action, content: JSON.stringify(_.defaults(content, {operator: username}))}, {transaction});
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
