'use strict';
const expect = require('chai').expect;
const helper = require('../helper');
const db = require('../../lib/schemes');

afterEach(() => helper.db.clean());

describe('schemes', () => {
    describe('accessLevel', () => {
        describe('#create', () => {
            let user, project, accessLevel;

            beforeEach(() => {
                return db.User.create({username: 'user1'}).then(x => user = x)
                    .then(() => db.Project.create({name: 'project1', createUserId: user.id})).then(x => project = x)
                    .then(() => db.AccessLevel.create({projectId: project.id, name: 'developer', canWriteOwnTasks: true}))
                    .then(x => accessLevel = x);
            });

            it('should create a new access level', () => {
                return db.AccessLevel.findAll().then(_levels => {
                    expect(_levels).to.have.lengthOf(1);
                    expect(_levels[0]).to.have.property('name', 'developer');
                    expect(_levels[0]).to.have.property('canWriteOwnTasks', true);
                    expect(_levels[0]).to.have.property('canWriteTasks', false);
                });
            });
        });
    });
});