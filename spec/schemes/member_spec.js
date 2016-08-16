'use strict';
var expect = require('chai').expect;
var _ = require('lodash');
var helper = require('../helper');
var db = require('../../schemes');

afterEach(() => helper.db.clean());

describe('schemes', () => {
    describe('member', () => {
        describe('create project and add member', () => {
            let users, project;
            let membersParams = [
                {accessLevelId: null, isVisible: true, wipLimit: 6},
                {accessLevelId: null, isVisible: false, wipLimit: 15}
            ];

            beforeEach(() => {
                users = [];
                return Promise.race(['user1', 'user2'].map(username => db.User.create({username}).then(_user => users.push(_user))))
                    .then(() => db.Project.create({name: 'project1', createUserId: users[0].id}).then(_project => project = _project))
                    .then(() => db.AccessLevel.create({name: 'developer', projectId: project.id})).then(x => membersParams.forEach(m => m.accessLevelId = x.id))
                    .then(() => Promise.race(users.map((user, idx) => project.addUser(user, membersParams[idx]))));
            });

            it('should create two members', () => {
                return db.Member.findAll().then(members => {
                    expect(members).to.have.lengthOf(2);

                    membersParams.forEach((params, idx) => {
                        _.forEach(params, (val, key) => {
                            expect(members[idx]).to.have.property(key, val);
                        });
                    });
                });
            });

            it('project should have two members', () => {
                return db.Project.findById(project.id, {include: [{model: db.User}]}).then(_project => {
                    expect(_project.users).to.have.lengthOf(2);

                    _project.users.forEach((_user, idx) => {
                        expect(_user).to.have.property('id', users[idx].id);
                        expect(_user).to.have.property('username', users[idx].username);
                        _.forEach(membersParams[idx], (val, key) => {
                            expect(_user.member).to.have.property(key, val);
                        });
                    });
                });
            });
        });
    });
});