'use strict';
const _ = require('lodash');
const app = require('../../app');
const request = require('supertest').agent(app.listen());
const passportStub = require('passport-stub');
const Project = require('../../lib/models/project');
const helper = require('../helper');
const expect = helper.expect;

function requestWrap (method, url, statusCode) {
    return request[method](url)
        .expect(statusCode)
        .expect('Content-Type', /json/);
}

describe('routes', () => {
    describe('api', () => {
        let stubUser = {username: 'stub-username', token: 'stub-token'};
        before(() => passportStub.install(app));
        after(() => passportStub.uninstall(app));

        describe('GET /api/projects', () => {
            let url = '/api/projects';
            context('not authorized', () => {
                it('should return 401 Unauthorized', () => requestWrap('get', url, 401));
            });

            context('authorized', () => {
                let project;
                before(() => Project.create('testProject', stubUser.username).then(x => { project = x; }));
                after(() => helper.db.clean());

                context('with a user having projects', () => {
                    beforeEach(() => passportStub.login(stubUser));
                    afterEach(() => passportStub.logout());

                    it('should return projects', () => requestWrap('get', url, 200)
                        .expect(res => {
                            expect(res.body.projects).to.lengthOf(1);
                            expect(res.body.projects[0].id).to.eq(project.id);
                        }));
                });

                context('with a user not having project', () => {
                    beforeEach(() => passportStub.login(_.defaults({username: 'otherUser'}, stubUser)));
                    afterEach(() => passportStub.logout());

                    it('should return empty', () => requestWrap('get', url, 200)
                        .expect(res => {
                            expect(res.body.projects).to.lengthOf(0);
                        }));
                });
            });
        });

        describe('GET /api/projects/:projectId', () => {
            let url = '/api/projects/'; // + :projectId
            let project;
            before(() => Project.create('testProject', stubUser.username).then(x => { project = x; }));
            after(() => helper.db.clean());

            context('not authorized', () => {
                it('should return 401 Unauthorized', () => requestWrap('get', url + project.id, 401));
            });

            context('authorized', () => {
                context('with a user having projects', () => {
                    beforeEach(() => passportStub.login(stubUser));
                    afterEach(() => passportStub.logout());

                    it('should return projects', () => requestWrap('get', url + project.id, 200)
                        .expect(res => expect(res.body.project.id).to.eq(project.id)));
                });

                context('with a user not having project', () => {
                    beforeEach(() => passportStub.login(_.defaults({username: 'otherUser'}, stubUser)));
                    afterEach(() => passportStub.logout());

                    it('should return 403 Forbidden', () => requestWrap('get', url + project.id, 403)
                        .expect('Content-Type', /json/));
                });

                context('with invalid projectId', () => {
                    beforeEach(() => passportStub.login(stubUser));
                    afterEach(() => passportStub.logout());

                    it('should return 404 Not found', () => requestWrap('get', url + 'invalid', 404));
                });
            });
        });

        describe('DELETE /api/projects/:projectId', () => {
            let url = '/api/projects/'; // + :projectId
            let project;
            before(() => Project.create('testProject', stubUser.username).then(x => { project = x; }));
            after(() => helper.db.clean());

            context('not authorized', () => {
                it('should return 401 Unauthorized', () => requestWrap('delete', url + project.id, 401));
            });

            context('authorized', () => {
                context('with a user having projects', () => {
                    beforeEach(() => passportStub.login(stubUser));
                    afterEach(() => passportStub.logout());

                    it('should archive the project', () => requestWrap('delete', url + project.id, 200)
                        .expect(res => expect(res.body.project.enabled).to.eq(false)));
                });

                context('with a user not having project', () => {
                    beforeEach(() => passportStub.login(_.defaults({username: 'otherUser'}, stubUser)));
                    afterEach(() => passportStub.logout());

                    it('should return 403 Forbidden', () => requestWrap('delete', url + project.id, 403)
                        .expect('Content-Type', /json/));
                });

                context('with invalid projectId', () => {
                    beforeEach(() => passportStub.login(stubUser));
                    afterEach(() => passportStub.logout());

                    it('should return 404 Not found', () => requestWrap('delete', url + 'invalid', 404));
                });
            });
        });

        describe('POST /api/projects', () => {
            let url = '/api/projects/';
            after(() => helper.db.clean());

            context('not authorized', () => {
                it('should return 401 Unauthorized', () => requestWrap('post', url, 401));
            });

            context('authorized', () => {
                beforeEach(() => passportStub.login(stubUser));
                afterEach(() => passportStub.logout());

                context('with project name', () => {
                    it('should archive the project', () => request.post(url)
                        .send({projectName: 'testProject'})
                        .expect(200)
                        .expect(res => {
                            expect(res.body.project.name).to.eq('testProject');
                        }));
                });

                context('without project name', () => {
                    it('should archive the project', () => requestWrap('post', url, 400));
                });
            });
        });
    });
});
