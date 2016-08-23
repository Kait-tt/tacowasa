'use strict';
const expect = require('chai').expect;
const _ = require('lodash');
const co = require('co');
const app = require('../../app');
const request = require('supertest').agent(app.listen());

describe('routes', () => {
    describe('index', () => {
        it('should return 200 OK', () => {
            return request
                .get('/')
                .expect(200);
        });
    });
});
