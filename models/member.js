'use strict';
const db = require('../schemes');
const _ = require('lodash');


class Member {
    // return Promise, resolve(user)
    static add(projectId, username, {wipLimit, isVisible, accessLevelId}={}) {
        return Promise.all([
            db.Project.findById(projectId),
            db.User.findOrCreate({where: {username}})
        ]).then(([_project, [_user]]) => _project.addUser(_user, {
            wipLimit: _.isNil(wipLimit) ? _project.defaultWipLimit : wipLimit,
            accessLevel: _.isNil(accessLevelId) ? _project.defaultAccessLevelId : accessLevelId,
            isVisible
        })).then(() => Member.get(projectId, username));
        // TODO: order
    }


    static remove(projectId, username) {
        return db.User.findOne({where: {username}})
            .then(user => db.Member.destroy({where: {projectId, userId: user.id}}));
        // TODO: order
    }

    static update(projectId, username, updateParams) {
        return db.User.findOne({where: {username}})
            .then(user => db.Member.update(updateParams, {where: {projectId, userId: user.id}}))
            .then(() => Member.get(projectId, username));
    }

    static updateOrder() {
        // TODO order
    }

    static get(projectId, username) {
        return Promise.all([
            db.Project.findById(projectId, {include: [db.User]}),
            db.User.findOne({where: {username}})
        ]).then(([_project, _user]) => {
            return _project.users.find(x => x.id === _user.id);
        });
    }
}

module.exports = Member;