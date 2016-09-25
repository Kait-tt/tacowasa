'use strict';
const co = require('co');
const expect = require('chai').expect;
const helper = require('../helper');
const db = require('../../lib/schemes');

afterEach(() => helper.db.clean());

describe('schemes', () => {
    describe('task', () => {
        describe('#create', () => {
            let user, project, stage, cost;

            beforeEach(co.wrap(function* () {
                user = yield db.User.create({username: 'user1'});
                project = yield db.Project.create({name: 'project1', createUserId: user.id});
                stage = yield db.Stage.create({name: 'todo', displayName: 'ToDo', assigned: true, projectId: project.id});
                cost = yield db.Cost.create({name: 'medium', value: 3, projectId: project.id});
                yield db.Task.create({
                    projectId: project.id,
                    stageId: stage.id,
                    userId: user.id,
                    costId: cost.id,
                    title: 'title1',
                    body: 'body1',
                    isWorking: true
                });
            }));

            it('should create a new task', () => {
                return db.Task.findAll({include: [{model: db.Cost}]}).then(tasks => {
                    expect(tasks).to.have.lengthOf(1);
                    expect(tasks[0]).to.have.property('title', 'title1');
                    expect(tasks[0]).to.have.deep.property('cost.value', 3);
                });
            });

            it('project should have a task', () => {
                return db.Project.findById(project.id, {include: [{model: db.Task, include: [{model: db.Cost}]}]}).then(_project => {
                    expect(_project.tasks).to.have.lengthOf(1);
                    expect(_project.tasks[0]).to.have.property('title', 'title1');
                    expect(_project.tasks[0]).to.have.deep.property('cost.value', 3);
                });
            });
        });
    });
});
