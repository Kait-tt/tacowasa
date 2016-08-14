'use strict';
var expect = require('chai').expect;
var helper = require('../helper');
var db = require('../../schemes');

afterEach(() => helper.db.clean());

describe('schemes', () => {
    describe('label', () => {
        describe('#create', () => {
            let user, project, label;

            beforeEach(() => {
                return db.User.create({username: 'user1'}).then(x => user = x)
                    .then(_user => db.Project.create({name: 'project1', createUserId: _user.id})).then(x => project = x)
                    .then(() => db.Label.create({name: 'label1', color: '343434', projectId: project.id})).then(x => label = x);
            });

            it('should create a new label', () => {
                return db.Label.findAll({include: [{all: true, nested: false}]}).then(_labels => {
                    expect(_labels).to.have.lengthOf(1);
                    expect(_labels[0]).to.have.property('name', 'label1');
                    expect(_labels[0]).to.have.property('color', '343434');
                });
            });

            describe('task#addLabel', () => {
                let stage, cost, task;

                beforeEach(() => {
                    return db.Stage.create({name: 'todo', displayName: 'ToDo', assigned: true, projectId: project.id}).then(x => stage = x)
                        .then(() => db.Cost.create({name: 'medium', value: 3, projectId: project.id}).then(x => cost = x))
                        .then(() => db.Task.create({
                            projectId: project.id, stageId: stage.id, userId: user.id, costId: cost.id,
                            title: 'title1', body: 'body1', isWorking: true
                        })).then(x => task = x)
                        .then(task => task.addLabel(label));
                });

                it('task should have a label', () => {
                    return db.Task.findById(task.id, {include: [{all: true, nested: true}]}).then(task => {
                        expect(task.labels).to.have.lengthOf(1);
                        expect(task.labels[0]).to.have.property('name', 'label1');
                    });
                });
            });
        });
    });
});