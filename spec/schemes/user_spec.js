'use strict';
const expect = require('chai').expect;
const helper = require('../helper');
const db = require('../../lib/schemes');


describe('schemes', () => {
    describe('user', () => {
        afterEach(() => helper.db.clean());

        describe('#create', () => {
            beforeEach(() => db.User.create({username: 'newUserName'}));

            it('should create a new user', () => {
                return db.User.findAll({include: [db.Project]}).then(users => {
                    expect(users).to.have.lengthOf(1);
                    expect(users[0]).to.have.property('username', 'newUserName');
                    expect(users[0].projects).to.have.lengthOf(0);
                });
            });

            context('and create', () => {
                beforeEach(() => db.User.create({username: 'secondUserName'}));

                it('should create two new user', () => {
                    return db.User.findAll().then(users => {
                        expect(users).to.have.lengthOf(2);
                    });
                });
            });
        });
    });
});
