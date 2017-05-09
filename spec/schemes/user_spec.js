'use strict';
const expect = require('chai').expect;
const helper = require('../helper');
const db = require('../../lib/schemes');


describe('schemes', () => {
    describe('user', () => {
        afterEach(() => helper.db.clean());

        describe('#create', () => {
            beforeEach(() => db.User.create({username: 'newUserName'}));

            it('should create a new user', async () => {
                const users = await db.User.findAll({include: [db.Project]});
                expect(users).to.have.lengthOf(1);
                expect(users[0]).to.have.property('username', 'newUserName');
                expect(users[0].projects).to.have.lengthOf(0);
            });

            context('and create', () => {
                beforeEach(() => db.User.create({username: 'secondUserName'}));

                it('should create two new user', async () => {
                    const users = await db.User.findAll();
                    expect(users).to.have.lengthOf(2);
                });
            });
        });
    });
});
