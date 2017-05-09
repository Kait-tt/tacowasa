'use strict';
const expect = require('chai').expect;
const helper = require('../helper');
const db = require('../../lib/schemes');


describe('schemes', () => {
    describe('label', () => {
        afterEach(() => helper.db.clean());

        describe('#create', () => {
            let user, project, label;

            beforeEach(async () => {
                user = await db.User.create({username: 'user1'});
                project = await db.Project.create({name: 'project1', createUserId: user.id});
                label = await db.Label.create({name: 'label1', color: '343434', projectId: project.id});
            });

            it('should create a new label', async () => {
                const _labels = await db.Label.findAll({include: [{all: true, nested: false}]});
                expect(_labels).to.have.lengthOf(1);
                expect(_labels[0]).to.have.property('name', 'label1');
                expect(_labels[0]).to.have.property('color', '343434');
            });

            describe('task#addLabel', () => {
                let stage, cost, task;

                beforeEach(async () => {
                    stage = await db.Stage.create({name: 'todo', displayName: 'ToDo', assigned: true, projectId: project.id});
                    cost = await db.Cost.create({name: 'medium', value: 3, projectId: project.id});
                    task = await db.Task.create({
                        projectId: project.id,
                        stageId: stage.id,
                        userId: user.id,
                        costId: cost.id,
                        title: 'title1',
                        body: 'body1',
                        isWorking: true
                    });
                    await task.addLabel(label);
                });

                it('task should have a label', async () => {
                    const _task = await db.Task.findById(task.id, {include: [{model: db.Label}]});
                    expect(_task.labels).to.have.lengthOf(1);
                    expect(_task.labels[0]).to.have.property('name', 'label1');
                });
            });
        });
    });
});
