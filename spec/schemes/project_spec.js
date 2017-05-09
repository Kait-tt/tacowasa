'use strict';
const expect = require('chai').expect;
const helper = require('../helper');
const db = require('../../lib/schemes');


describe('schemes', () => {
    describe('project', () => {
        afterEach(() => helper.db.clean());

        describe('#create', () => {
            beforeEach(async () => {
                const user = await db.User.create({username: 'user1'});
                await db.Project.create({name: 'project1', createUserId: user.id});
            });

            it('should create a project', async () => {
                const projects = await db.Project.findAll({include: [db.Stage, db.User, {model: db.Stage, as: 'defaultStage'}]});

                expect(projects).to.have.lengthOf(1);
                expect(projects[0]).to.have.property('name', 'project1');

                // id
                expect(projects[0]).to.have.property('id');
                expect(projects[0].id).to.have.lengthOf(12);

                // users
                expect(projects[0]).to.have.property('users');
                expect(projects[0].users).to.have.lengthOf(0);

                // stages
                expect(projects[0]).to.have.property('stages');
                expect(projects[0].stages).to.have.lengthOf(0);
            });
        });
    });
});
