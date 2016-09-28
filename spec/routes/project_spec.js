'use strict';
const app = require('../../app');
const request = require('supertest').agent(app.listen());
const passportStub = require('passport-stub');
const Project = require('../../lib/models/project');
const helper = require('../helper');
const _ = require('lodash');
_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

describe('routes', () => {
    describe('project', () => {
        let stubUser = {username: 'stub-username', token: 'stub-token'};
        let project;
        before(() => {
            passportStub.install(app);
            return Project.create('testProject', stubUser.username).then(x => { project = x; });
        });
        after(() => {
            passportStub.uninstall(app);
            return helper.db.clean();
        });

        describe('GET /:projectId/:projectName', () => {
            let url = _.template('/users/{{username}}/projects/{{projectId}}/{{projectName}}');
            let validUrlParams = () => ({username: stubUser.username, projectId: project.id, projectName: project.name});

            context('not authorized', () => {
                it('should return 302 and redirect to /', () => {
                    return request
                        .get(url(validUrlParams()))
                        .expect('Location', '/?mustlogin=1')
                        .expect(302);
                });
            });

            context('authorized', () => {
                beforeEach(() => passportStub.login(stubUser));
                afterEach(() => passportStub.logout());

                context('with valid params', () => {
                    it('should return 200 OK', () => {
                        return request
                            .get(url(validUrlParams()))
                            .expect('Content-Type', /text\/html/)
                            .expect(200);
                    });
                });

                context('with invalid project id', () => {
                    it('should return 404 Not found', () => {
                        return request
                            .get(url(_.assign(validUrlParams(), {projectId: 'invalid'})))
                            .expect(404);
                    });
                });

                context('with invalid project name', () => {
                    it('should return 404 Not found', () => {
                        return request
                            .get(url(_.assign(validUrlParams(), {projectName: 'invalid'})))
                            .expect(404);
                    });
                });

                context('with invalid username', () => {
                    it('should return 404 Not found', () => {
                        return request
                            .get(url(_.assign(validUrlParams(), {username: 'invalid'})))
                            .expect(404);
                    });
                });
            });
        });
    });
});
