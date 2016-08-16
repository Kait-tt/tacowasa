'use strict';
var expect = require('chai').expect;
var helper = require('../helper');
var db = require('../../schemes');

afterEach(() => helper.db.clean());

describe('schemes', () => {
    describe('stage', () => {
        describe('#create', () => {
            let project, stage;

            beforeEach(() => {
                return db.User.create({username: 'user1'})
                    .then(user => db.Project.create({name: 'project1', createUserId: user.id}).then(x => project = x))
                    .then(() => db.Stage.create({name: 'todo', displayName: 'ToDo', assigned: true, projectId: project.id}).then(x => stage = x))
                    .then(() => project.addStage(stage));
            });

            it('should create a new stage', () => {
                return db.Stage.findAll().then(_stages => {
                    expect(_stages).to.have.lengthOf(1);
                    expect(_stages[0]).to.have.property('name', 'todo');
                    expect(_stages[0]).to.have.property('displayName', 'ToDo');
                    expect(_stages[0]).to.have.property('assigned', true);
                    expect(_stages[0]).to.have.property('projectId', project.id);
                });
            });

            it('project should have a stage', () => {
                return db.Project.findById(project.id, {include: [{model: db.Stage, as: 'stages'}]}).then(_project => {
                    expect(_project.stages).to.have.lengthOf(1);
                    expect(_project.stages[0]).to.have.property('id', stage.id);
                    expect(_project.stages[0]).to.have.property('name', 'todo');
                });
            });
        });
    });
});