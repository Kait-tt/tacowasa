'use strict';
var expect = require('chai').expect;
var helper = require('../helper');
var db = require('../../schemes');

afterEach(() => helper.db.clean());

describe('schemes', () => {
    describe('project', () => {
        describe('#create', () => {
            beforeEach(() => {
                return db.User.create({username: 'user1'})
                    .then(user => db.Project.create({name: 'project1', createUserId: user.id }));
            });

            it('should create a project', () => {
                return db.Project.findAll({include: [db.User]}).then(projects => {
                    console.log(projects[0].toJSON());
                    expect(projects).to.have.lengthOf(1);
                    expect(projects[0]).to.have.property('name', 'project1');
                });
            });
        });
    });
});