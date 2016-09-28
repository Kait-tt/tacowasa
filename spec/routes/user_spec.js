'use strict';
const app = require('../../app');
const request = require('supertest').agent(app.listen());
const passportStub = require('passport-stub');
const sinon = require('sinon');
const User = require('../../lib/models/user');

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

        describe('GET /users//:username/avatar', () => {
            let url = `/users/${stubUser.username}/avatar`;
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

                context('with exists avatar', () => {
                    const avatarDir = `${__dirname}/../fixtures/`;
                    const avatarFilename = 'avatar.png';
                    let stub;
                    beforeEach(() => {
                        stub = sinon.stub(User, 'avatarFilePath');
                        stub.returns(Promise.resolve({dir: avatarDir, file: avatarFilename}));
                    });
                    afterEach(() => stub.restore());

                    it('should return 200 OK', () => {
                        return request
                            .get(url)
                            .expect('Content-Type', /image\/png/)
                            .expect(200);
                    });
                });

                context('with not exists avatar', () => {
                    it('should return 404 Not found', () => {
                        return request
                            .get(url)
                            .expect(404);
                    });
                });
            });
        });
    });
});
