'use strict';
const co = require('co');
const expect = require('chai').expect;
const helper = require('../helper');
const db = require('../../lib/schemes');


describe('schemes', () => {
    describe('label', () => {
        afterEach(() => helper.db.clean());

        describe('#create', () => {
            let user, project, label;

            beforeEach(co.wrap(function* () {
                user = yield db.User.create({username: 'user1'});
                project = yield db.Project.create({name: 'project1', createUserId: user.id});
                label = yield db.Label.create({name: 'label1', color: '343434', projectId: project.id});
            }));

            it('should create a new label', () => {
                return db.Label.findAll({include: [{all: true, nested: false}]}).then(_labels => {
                    expect(_labels).to.have.lengthOf(1);
                    expect(_labels[0]).to.have.property('name', 'label1');
                    expect(_labels[0]).to.have.property('color', '343434');
                });
            });

            describe('task#addLabel', () => {
                let stage, cost, task;

                beforeEach(co.wrap(function* () {
                    stage = yield db.Stage.create({name: 'todo', displayName: 'ToDo', assigned: true, projectId: project.id});
                    cost = yield db.Cost.create({name: 'medium', value: 3, projectId: project.id});
                    task = yield db.Task.create({
                        projectId: project.id,
                        stageId: stage.id,
                        userId: user.id,
                        costId: cost.id,
                        title: 'title1',
                        body: 'body1',
                        isWorking: true
                    });
                    yield task.addLabel(label);
                }));

                it('task should have a label', () => {
                    return db.Task.findById(task.id, {include: [{model: db.Label}]}).then(task => {
                        expect(task.labels).to.have.lengthOf(1);
                        expect(task.labels[0]).to.have.property('name', 'label1');
                    });
                });
            });
        });
    });
});
