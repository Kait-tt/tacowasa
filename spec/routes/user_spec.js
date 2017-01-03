'use strict';
const app = require('../../app');
const request = require('supertest').agent(app.listen());
const passportStub = require('passport-stub');

describe('routes', () => {
    describe('user', () => {
        let stubUser = {username: 'stub-username', token: 'stub-token'};
        before(() => passportStub.install(app));
        after(() => passportStub.uninstall(app));

        describe('GET /users//me', () => {
            let url = '/users/me';
            context('not authorized', () => {
                it('should return 302 and redirect to /', () => {
                    return request
                        .get(url)
                        .expect('Location', '/?mustlogin=1')
                        .expect(302);
                });
            });

            context('authorized', () => {
                beforeEach(() => passportStub.login(stubUser));
                afterEach(() => passportStub.logout());

                it('should return 200 OK', () => {
                    return request
                        .get(url)
                        .expect('Content-Type', /text\/html/)
                        .expect(200);
                });
            });
        });
    });
});
