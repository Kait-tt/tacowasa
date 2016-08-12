'use strict';
var expect = require('chai').expect;
var helper = require('../helper');
var db = require('../../schemes');

afterEach(() => helper.db.clean());

describe('schemes', () => {
    describe('task', () => {
        describe('#create', () => {
            let user, project, stage, cost;

            beforeEach(() => {
                return db.User.create({username: 'user1'}).then(x => user = x)
                    .then(user => db.Project.create({name: 'project1', createUserId: user.id}).then(x => project = x))
                    .then(() => db.Stage.create({name: 'todo', displayName: 'ToDo', assigned: true, projectId: project.id}).then(x => stage = x))
                    .then(() => db.Cost.create({name: 'medium', value: 3, projectId: project.id}).then(x => cost = x))
                    .then(() => db.Task.create({
                        projectId: project.id, stageId: stage.id, userId: user.id, costId: cost.id,
                        title: 'title1', body: 'body1', isWorking: true
                    }));
            });

            it('should create a new task', () => {
                return db.Task.findAll({include: [{all: true, nested: true}]}).then(tasks => {
                    expect(tasks).to.have.lengthOf(1);
                    expect(tasks[0]).to.have.property('title', 'title1');
                    expect(tasks[0]).to.have.deep.property('cost.value', 3);
                })
            });

            it('project should have a task', () => {
                return db.Project.findById(project.id, {include: [{all: true, nested: true}]}).then(_project => {
                    expect(_project.tasks).to.have.lengthOf(1);
                    expect(_project.tasks[0]).to.have.property('title', 'title1');
                    expect(_project.tasks[0]).to.have.deep.property('cost.value', 3);
                });
            });
        });
    });
});