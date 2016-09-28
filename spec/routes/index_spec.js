'use strict';
const app = require('../../app');
const request = require('supertest').agent(app.listen());

describe('routes', () => {
    describe('index', () => {
        it('should return 200 OK and html', () => {
            return request
                .get('/')
                .expect('Content-Type', /text\/html/)
                .expect(200);
        });
    });
});
