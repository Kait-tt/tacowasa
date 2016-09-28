'use strict';
const app = require('../../../../app');
const request = require('supertest').agent(app.listen());
const passportStub = require('passport-stub');
const sinon = require('sinon');
const helper = require('../../../../spec/helper');
const expect = helper.expect;
const GitHubAPI = require('../../models/github_api');

describe('addons', () => {
    describe('github', () => {
        describe('router', () => {
            describe('api', () => {
                let stubUser = {username: 'stub-username', token: 'stub-token'};
                before(() => passportStub.install(app));
                after(() => passportStub.uninstall(app));

                describe('POST /github/api/projects', () => {
                    let url = '/github/api/projects';
                    context('not authorized', () => {
                        it('should return 401 Unauthorized', () => request.post(url)
                            .expect(401)
                            .expect('Content-Type', /json/));
                    });

                    context('authorized', () => {
                        let stub;
                        beforeEach(() => {
                            passportStub.login(stubUser);
                            stub = sinon.stub(GitHubAPI.prototype, 'importProject');
                        });
                        afterEach(() => {
                            passportStub.logout();
                            stub.restore();
                            return helper.db.clean();
                        });
                        let validParams = {username: 'projectUsername', reponame: 'projectReponame'};

                        context('with username and reponame', () => {
                            beforeEach(() => stub.returns(Promise.resolve(({id: '1', name: validParams.reponame}))));
                            it('should called GitHub.importProject and return imported project', () => request.post(url)
                                .send(validParams)
                                .expect(200)
                                .expect('Content-Type', /json/)
                                .expect(res => {
                                    sinon.assert.calledOnce(stub);
                                    expect(res.body.project.name).to.eq(validParams.reponame);
                                }));
                        });

                        context('without username', () => {
                            it('should return 400 Invalid arguments', () => request.post(url)
                                .send({reponame: validParams.reponame})
                                .expect(400)
                                .expect('Content-Type', /json/));
                        });

                        context('without reponame', () => {
                            it('should return 400 Invalid arguments', () => request.post(url)
                                .send({username: validParams.username})
                                .expect(400)
                                .expect('Content-Type', /json/));
                        });

                        context('with server error', () => {
                            beforeEach(() => stub.returns(Promise.reject()));
                            it('should return 500 Server error', () => request.post(url)
                                .send(validParams)
                                .expect(500)
                                .expect('Content-Type', /json/));
                        });
                    });
                });
            });
        });
    });
});
