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
                return db.Project.findAll({include: [{all: true, bested: true}]})
                    .then(projects => {
                        console.log(projects[0].toJSON());
                        expect(projects).to.have.lengthOf(1);
                        expect(projects[0]).to.have.property('name', 'project1');
                        expect(projects[0]).to.have.property('id');
                        expect(projects[0].id).to.have.lengthOf(12);
                        expect(projects[0].users).to.have.lengthOf(0);
                    });
            });
        });
    });
});