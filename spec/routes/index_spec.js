'use strict';
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
