'use strict';
var expect = require('chai').expect;
var _ = require('lodash');
var helper = require('../helper');
var db = require('../../schemes');

afterEach(() => helper.db.clean());

describe('schemes', () => {
    describe('member', () => {
        describe('create project and its member', () => {
            let user1, user2, project1;
            let memberParams1 = {accessLevelId: 1, isVisible: true, wipLimit: 6};
            let memberParams2 = {accessLevelId: 0, isVisible: false, wipLimit: 15};

            beforeEach(() => {
                return db.User.create({username: 'user1'})
                    .then(user => user1 = user)
                    .then(() => db.User.create({username: 'user2'}))
                    .then(user => user2 = user)
                    .then(() => db.Project.create({name: 'project1', createUserId: user1.id}))
                    .then(project => project1 = project)
                    .then(() => project1.addUser(user1, memberParams1))
                    .then(() => project1.addUser(user2, memberParams2));
            });

            it('should create two members', () => {
                return db.Member.findAll().then(members => {
                    expect(members).to.have.lengthOf(2);
                    [[user1, memberParams1], [user2, memberParams2]].forEach(([user, params], idx) => {
                        _.forEach(params, (val, key) => {
                            expect(members[idx]).to.have.property(key, val);
                        });
                    });
                });
            });

            it('project should have two members', () => {
                return db.Project.findById(project1.id, {include: [{all: true, nested: true}]}).then(project => {
                    expect(project.users).to.have.lengthOf(2);

                    [[project.users[0], user1, memberParams1], [project.users[1], user2, memberParams2]]
                        .forEach(([user, userParams, memberParams]) => {
                            expect(user).to.have.property('id', userParams.id);
                            expect(user).to.have.property('username', userParams.username);
                            _.forEach(memberParams, (val, key) => {
                                expect(user.member).to.have.property(key, val);
                            });
                        });
                });
            });
        });
    });
});