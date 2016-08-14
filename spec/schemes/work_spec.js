'use strict';
var expect = require('chai').expect;
var helper = require('../helper');
var db = require('../../schemes');

afterEach(() => helper.db.clean());

describe('schemes', () => {
    describe('label', () => {
        describe('#create', () => {
            let user, project, label, stage, cost, task, work;

            beforeEach(() => {
                return db.User.create({username: 'user1'}).then(x => user = x)
                    .then(_user => db.Project.create({name: 'project1', createUserId: _user.id})).then(x => project = x)
                    .then(() => db.Stage.create({name: 'todo', displayName: 'ToDo', assigned: true, projectId: project.id}).then(x => stage = x))
                    .then(() => db.Cost.create({name: 'medium', value: 3, projectId: project.id}).then(x => cost = x))
                    .then(() => db.Task.create({
                        projectId: project.id, stageId: stage.id, userId: user.id, costId: cost.id,
                        title: 'title1', body: 'body1', isWorking: true
                    }).then(x => task = x))
                    .then(() => db.Work.create({userId: user.id, taskId: task.id}).then(x => work = x));
            });

            it('should create a new work', () => {
                return db.Work.findAll({include: [{all: true, nested: false}]}).then(_works => {
                    expect(_works).to.have.lengthOf(1);
                    expect(_works[0]).to.have.property('isEnded', false);
                    expect(_works[0]).to.have.property('startTime');
                    expect(_works[0]).to.have.property('endTime', null);
                });
            });

            it('the task should have a work', () => {
                return db.Task.findById(task.id, {include: [{model: db.Work}]}).then(_task => {
                    expect(_task.works).to.have.lengthOf(1);
                    expect(_task.works[0]).to.have.property('isEnded', false);
                });
            });
        });
    });
});