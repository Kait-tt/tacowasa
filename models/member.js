'use strict';
const db = require('../schemes');
const _ = require('lodash');
const co = require('co');

class Member {
    // return Promise, resolve(user)
    // add == unshift
    static add(projectId, username, {wipLimit, isVisible, accessLevelId}={}) {
        return co(function* () {
            const project = yield db.Project.findById(projectId, {include: [db.User]});

            // already added?
            if (_.find(project.users, {username})) {
                new Error(`${username} is added to ${project.name}(${project.id})`);
            }

            const user = yield db.User.findOrCreate({where: {username}});
            const firstUser = project.users.find(x => !x.member.prevMemberId);

            // add
            yield project.addUser(user, {
                nextMemberId: firstUser && firstUser.member.id,
                wipLimit: _.isNil(wipLimit) ? project.defaultWipLimit : wipLimit,
                accessLevel: _.isNil(accessLevelId) ? project.defaultAccessLevelId : accessLevelId,
                isVisible
            });
            const addedUser = yield Member.findByUsername(projectId, username);

            // update link
            if (firstUser) {
                yield db.Member.update({prevMemberId: addedUser.member.id}, {where: {id: firstUser.member.id}});
            }

            return addedUser;
        });
    }

    static remove(projectId, username) {
        return co(function* () {
            const user = yield Member.findByUsername(projectId, username);

            // user is not found?
            if (!user) {
                const project = yield db.Project.findById(projectId);
                new Error(`${username} was not found in ${project.name}(${projectId})`);
            }

            // update link
            const {prevMemberId, nextMemberId} = user.member;
            if (prevMemberId) {
                yield db.Member.update({nextMemberId}, {where: {projectId, id: prevMemberId}});
            }
            if (nextMemberId) {
                yield db.Member.update({prevMemberId}, {where: {projectId, id: nextMemberId}});
            }

            // destroy!
            yield db.Member.destroy({where: {projectId, userId: user.id}});
        });
    }

    static update(projectId, username, updateParams) {
        // include prohibited params?
        if (_.intersection(Object.keys(updateParams), ['prevMemberId', 'nextMemberId']).length) {
            new Error('update method cannot update member order. use updateOrder method.');
        }

        return co(function* () {
            const user = yield db.User.findOne({where: {username}});
            yield db.Member.update(updateParams, {where: {projectId, userId: user.id}});
            return yield Member.findByUsername(projectId, username);
        });
    }

    // update position of username to before beforeUsername
    static updateOrder(projectId, username, beforeUsername) {
        return co(function* () {
            const project = yield db.Project.findById(projectId, {include: [db.User]});
            const user = _.find(project.users, {username});
            const beforeUser = beforeUsername && _.find(project.users, {username: beforeUsername});

            // user is not found?
            if (!user) {
                new Error(`${username} was not found in ${project.name}(${project.id})`);
            }

            // beforeUser is not found?
            if (beforeUsername && !beforeUser) {
                new Error(`${beforeUsername} was not found in ${project.name}(${project.id})`);
            }

            // same position?
            if (beforeUser && beforeUser.member.prevMemberId === user.member.id) { return; }
            if (!beforeUser && !user.member.nextMemberId) { return; }

            // update old around links
            {
                const {prevMemberId, nextMemberId} = user.member;
                if (prevMemberId) {
                    yield db.Member.update({nextMemberId}, {where: {projectId, id: prevMemberId}});
                }
                if (nextMemberId) {
                    yield db.Member.update({prevMemberId}, {where: {projectId, id: nextMemberId}});
                }
            }

            // insert and update links
            const nextMemberId = beforeUser ? beforeUser.member.id : null;
            const prevMemberId = beforeUser ? beforeUser.member.prevMemberId :
                project.users.find(x => !x.member.nextMemberId).member.id;
            // update prev member
            if (prevMemberId) {
                yield db.Member.update({nextMemberId: user.member.id}, {where: {projectId, id: prevMemberId}});
            }
            // update next member
            if (nextMemberId) {
                yield db.Member.update({prevMemberId: user.member.id}, {where: {projectId, id: nextMemberId}});
            }
            // update target member
            yield db.Member.update({prevMemberId, nextMemberId}, {where: {projectId, id: user.member.id}});
        });
    }

    static findByUsername(projectId, username) {
        return Promise.all([
            db.Project.findById(projectId, {include: [db.User]}),
            db.User.findOne({where: {username}})
        ]).then(([project, user]) => {
            return project.users.find(x => x.id === user.id);
        });
    }

    static getAllSorted(projectId) {
        return db.Project.findById(projectId, {include: [db.User]})
            .then(project => Member.sortMembers(project.users));
    }

    static sortMembers(users) {
        if (!users.length) {
            return [];
        }

        const src = {};
        users.forEach(user => src[user.member.id] = user);

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