'use strict';
const expect = require('chai').expect;
const _ = require('lodash');
const co = require('co');
const helper = require('../helper');
const db = require('../../lib/schemes');
const User = require('../../lib/models/user');

afterEach(() => helper.db.clean());

describe('models', () => {
    describe('user', () => {
        describe('#findOrCreate', () => {
            context('with not exists user', () => {
                let user, users;
                beforeEach(() => co(function* () {
                    user = yield User.findOrCreate('user1');
                    users = yield User.findAll();
                }));

                it('should create a new user', () => {
                    expect(user).to.have.property('username', 'user1');
                    expect(users).to.lengthOf(1);
                });

                context('with exists user', () => {
                    beforeEach(() => co(function* () {
                        user = yield User.findOrCreate('user1');
                        users = yield User.findAll();
                    }));

                    it('should not create a user', () => {
                        expect(user).to.have.property('username', 'user1');
                        expect(users).to.lengthOf(1);
                    });
                });
            });
        });
    });
});
