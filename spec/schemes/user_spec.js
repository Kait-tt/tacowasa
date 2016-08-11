'use strict';
var expect = require('chai').expect;
var helper = require('../helper');
var db = require('../../schemes');

afterEach(() => helper.db.clean());

describe('schemes', () => {
    describe('user', () => {
        it('should return 5 of given 5', () => expect(5).to.be.equal(5));
    });
});