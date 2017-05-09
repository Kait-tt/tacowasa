'use strict';
const expect = require('chai').expect;
const helper = require('../helper');
const db = require('../../lib/schemes');

describe('schemes', () => {
    describe('accessLevel', () => {
        afterEach(() => helper.db.clean());

        describe('#create', () => {
            let user, project;

            beforeEach(async () => {
                user = await db.User.create({username: 'user1'});
                project = await db.Project.create({name: 'project1', createUserId: user.id});
                await db.AccessLevel.create({projectId: project.id, name: 'developer', canWriteOwnTasks: true});
            });

            it('should create a new access level', async () => {
                const _levels = await db.AccessLevel.findAll();
                expect(_levels).to.have.lengthOf(1);
                expect(_levels[0]).to.have.property('name', 'developer');
                expect(_levels[0]).to.have.property('canWriteOwnTasks', true);
                expect(_levels[0]).to.have.property('canWriteTasks', false);
            });
        });
    });
});
