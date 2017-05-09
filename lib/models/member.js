'use strict';
const db = require('../schemes');
const _ = require('lodash');
const User = require('../models/user');

class Member {
    static async findByUsername (projectId, username, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const project = await db.Project.findById(projectId, {include: [{model: db.User}], transaction});
            const user = await db.User.findOne({where: {username}, transaction});
            return project.users.find(x => x.id === user.id);
        });
    }

    static async findByUserId (projectId, userId, {transaction} = {}) {
        const project = await db.Project.findById(projectId, {include: [db.User], transaction});
        const member = project.users.find(x => x.id === userId);
        return member && member.toJSON();
    }

    static async getAllSorted (projectId, {transaction} = {}) {
        const project = await db.Project.findById(projectId, {include: [db.User], transaction});
        return Member.sort(project.users).map(x => x.toJSON());
    }

    // return Promise, resolve(user)
    // add == unshift
    static async add (projectId, username, {wipLimit, isVisible, accessLevelId} = {}, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const project = await db.Project.findById(projectId, {include: [db.User], transaction});

            // valid username?
            if (!username) {
                throw new Error(`invalid username: ${username}`);
            }

            // already added?
            if (_.find(project.users, {username})) {
                throw new Error(`${username} is added to ${project.name}(${project.id})`);
            }

            const user = await User.findOrCreate(username, {transaction});
            const firstUser = project.users.find(x => !x.member.prevMemberId);

            // add
            await db.Member.create({
                projectId,
                userId: user.id,
                nextMemberId: firstUser && firstUser.member.id,
                wipLimit: _.isNil(wipLimit) ? project.defaultWipLimit : wipLimit,
                accessLevel: _.isNil(accessLevelId) ? project.defaultAccessLevelId : accessLevelId,
                isVisible
            }, {transaction});
            const addedUser = await Member.findByUsername(projectId, username, {transaction});

            // update link
            if (firstUser) {
                await db.Member.update({prevMemberId: addedUser.member.id}, {where: {id: firstUser.member.id}, transaction});
            }

            return addedUser;
        });
    }

    static async remove (projectId, username, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const user = await Member.findByUsername(projectId, username, {transaction});

            // user is not found?
            if (!user) {
                const project = await db.Project.findById(projectId, {transaction});
                throw new Error(`${username} was not found in ${project.name}(${projectId})`);
            }

            // update link
            const {prevMemberId, nextMemberId} = user.member;
            if (prevMemberId) {
                await db.Member.update({nextMemberId}, {where: {projectId, id: prevMemberId}, transaction});
            }
            if (nextMemberId) {
                await db.Member.update({prevMemberId}, {where: {projectId, id: nextMemberId}, transaction});
            }

            // destroy!
            await db.Member.destroy({where: {projectId, userId: user.id}, transaction});

            return user;
        });
    }

    static async update (projectId, username, updateParams, {transaction} = {}) {
        // include prohibited params?
        if (_.intersection(Object.keys(updateParams), ['prevMemberId', 'nextMemberId']).length) {
            throw new Error('update method cannot update member order. use updateOrder method.');
        }

        return db.transaction({transaction}, async transaction => {
            const user = await db.User.findOne({where: {username}, transaction});
            await db.Member.update(updateParams, {where: {projectId, userId: user.id}, transaction});
            return await Member.findByUsername(projectId, username, {transaction});
        });
    }

    // update position of username to before beforeUsername
    static async updateOrder (projectId, username, beforeUsername, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const project = await db.Project.findById(projectId, {include: [db.User], transaction});
            const user = _.find(project.users, {username});
            const beforeUser = beforeUsername && _.find(project.users, {username: beforeUsername});

            // user is not found?
            if (!user) {
                throw new Error(`${username} was not found in ${project.name}(${project.id})`);
            }

            // beforeUser is not found?
            if (beforeUsername && !beforeUser) {
                throw new Error(`${beforeUsername} was not found in ${project.name}(${project.id})`);
            }

            // same position?
            if (beforeUser && beforeUser.member.prevMemberId === user.member.id) { return; }
            if (!beforeUser && !user.member.nextMemberId) { return; }

            // update old around links
            {
                const {prevMemberId, nextMemberId} = user.member;
                if (prevMemberId) {
                    await db.Member.update({nextMemberId}, {where: {projectId, id: prevMemberId}, transaction});
                }
                if (nextMemberId) {
                    await db.Member.update({prevMemberId}, {where: {projectId, id: nextMemberId}, transaction});
                }
            }

            // insert and update links
            const nextMemberId = beforeUser ? beforeUser.member.id : null;
            const prevMemberId = beforeUser ? beforeUser.member.prevMemberId
                : project.users.find(x => !x.member.nextMemberId).member.id;
            // update prev member
            if (prevMemberId) {
                await db.Member.update({nextMemberId: user.member.id}, {where: {projectId, id: prevMemberId}, transaction});
            }
            // update next member
            if (nextMemberId) {
                await db.Member.update({prevMemberId: user.member.id}, {where: {projectId, id: nextMemberId}, transaction});
            }
            // update target member
            await db.Member.update({prevMemberId, nextMemberId}, {where: {projectId, id: user.member.id}, transaction});

            return {
                user: await Member.findByUserId(projectId, user.id, {transaction}),
                beforeUser: beforeUser ? (await Member.findByUserId(projectId, beforeUser.id, {transaction})) : null
            };
        });
    }

    static sort (users) {
        if (!users.length) {
            return [];
        }

        const src = {};
        users.forEach(user => { src[user.member.id] = user; });

        const res = [];
        const firstUser = users.find(x => !x.member.prevMemberId);
        res.push(firstUser);
        src[firstUser.member.id] = null;

        let lastUser = firstUser;
        while (lastUser.member.nextMemberId) {
            lastUser = src[lastUser.member.nextMemberId];
            res.push(lastUser);
            src[lastUser.member.id] = null;
        }

        return res;
    }
}

module.exports = Member;
