'use strict';
var expect = require('chai').expect;
var helper = require('../helper');
var db = require('../../schemes');

afterEach(() => helper.db.clean());

describe('schemes', () => {
    describe('stage', () => {
        describe('#create', () => {
            let project1;

            beforeEach(() => {
                return db.User.create({username: 'user1'})
                    .then(user => db.Project.create({name: 'project1', createUserId: user.id }))
                    .then(project => {
                        project1 = project;
                        return db.Stage.create({name: 'todo', displayName: 'ToDo', assigned: true, projectId: project.id});
                    });
            });

            it('should create a new stage', () => {
                return db.Stage.findAll().then(stages => {
                    expect(stages).to.have.lengthOf(1);
                    expect(stages[0]).to.have.property('name', 'todo');
                    expect(stages[0]).to.have.property('displayName', 'ToDo');
                    expect(stages[0]).to.have.property('assigned', true);
                    expect(stages[0]).to.have.property('projectId', project1.id);
                });
            });
        });
    });
});