'use strict';
const expect = require('chai').expect;
const helper = require('../helper');
const db = require('../../lib/schemes');


describe('schemes', () => {
    describe('task', () => {
        afterEach(() => helper.db.clean());

        describe('#create', () => {
            let user, project, stage, cost;

            beforeEach(async () => {
                user = await db.User.create({username: 'user1'});
                project = await db.Project.create({name: 'project1', createUserId: user.id});
                stage = await db.Stage.create({name: 'todo', displayName: 'ToDo', assigned: true, projectId: project.id});
                cost = await db.Cost.create({name: 'medium', value: 3, projectId: project.id});
                await db.Task.create({
                    projectId: project.id,
                    stageId: stage.id,
                    userId: user.id,
                    costId: cost.id,
                    title: 'title1',
                    body: 'body1',
                    isWorking: true
                });
            });

            it('should create a new task', async () => {
                const tasks = await db.Task.findAll({include: [{model: db.Cost}]});
                expect(tasks).to.have.lengthOf(1);
                expect(tasks[0]).to.have.property('title', 'title1');
                expect(tasks[0]).to.have.deep.property('cost.value', 3);
            });

            it('project should have a task', async () => {
                const _project = await db.Project.findById(project.id, {include: [{model: db.Task, include: [{model: db.Cost}]}]});
                expect(_project.tasks).to.have.lengthOf(1);
                expect(_project.tasks[0]).to.have.property('title', 'title1');
                expect(_project.tasks[0]).to.have.deep.property('cost.value', 3);
            });
        });
    });
});
