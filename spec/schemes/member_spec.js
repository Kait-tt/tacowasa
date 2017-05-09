'use strict';
const expect = require('chai').expect;
const _ = require('lodash');
const helper = require('../helper');
const db = require('../../lib/schemes');


describe('schemes', () => {
    describe('member', () => {
        afterEach(() => helper.db.clean());

        describe('create project and add member', () => {
            let users, project;
            let membersParams = [
                {accessLevelId: null, isVisible: true, wipLimit: 6},
                {accessLevelId: null, isVisible: false, wipLimit: 15}
            ];

            beforeEach(async () => {
                users = [];

                for (let username of ['user1', 'user2']) {
                    const user = await db.User.create({username});
                    users.push(user);
                }
                project = await db.Project.create({name: 'project1', createUserId: users[0].id});
                const accessLevel = await db.AccessLevel.create({name: 'developer', projectId: project.id});
                for (let idx of [0, 1]) {
                    membersParams[idx].accessLevelId = accessLevel.id;
                    await project.addUser(users[idx], membersParams[idx]);
                }
            });

            it('should create two members', async () => {
                const members = await db.Member.findAll();
                expect(members).to.have.lengthOf(2);

                membersParams.forEach((params, idx) => {
                    _.forEach(params, (val, key) => {
                        expect(members[idx]).to.have.property(key, val);
                    });
                });
            });

            it('project should have two members', async () => {
                const _project = await db.Project.findById(project.id, {include: [{model: db.User}]});
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
