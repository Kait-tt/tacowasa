'use strict';
const fs = require('fs');
const co = require('co');
const _ = require('lodash');
const app = require('../../../../app');
const request = require('supertest').agent(app.listen());
const sinon = require('sinon');
const helper = require('../../../../spec/helper');
const expect = helper.expect;
const Project = require('../../../../lib/models/project');
const Task = require('../../../../lib/models/task');
const Member = require('../../../../lib/models/member');
const GitHubAddonIssueHook = require('../../controller/hook/issueHook');
const db = require('../../schemas');

// TODO: test of emit and notifyText
describe('addons', () => {
    describe('github', () => {
        describe('router', () => {
            describe('hook', () => {
                let project;
                let otherUser;
                const url = (projectId) => `/github/hook/${projectId}`;
                before(co.wrap(function* () {
                    project = yield Project.create('testProject', 'testUser');
                    otherUser = (yield db.User.findOrCreate({where: {username: 'otherUsername'}}))[0];
                    yield Member.add(project.id, otherUser.username);
                }));
                after(() => {
                    return helper.db.clean();
                });
                afterEach(() => {
                    afterEach(() => db.Task.destroy({where: {}})
                        .then(() => db.GitHubTask.destroy({where: {}})));
                });

                describe('issue', () => {
                    const requestWrap = (projectId, body) => request.post(url(projectId))
                        .set('x-Github-Event', 'issue')
                        .send(body)
                        .expect('Content-Type', /json/);
                    let body;
                    let socketProjectStub;
                    let task;
                    const shouldCreateNewTask = () => {
                        it('should create a new task', () => requestWrap(project.id, body)
                            .expect(200)
                            .expect(res => co(function* () {
                                expect(res.body).property('message').that.match(/created task/);
                                const tasks = yield Task.findAll(project.id, {include: []});
                                expect(tasks).to.lengthOf(1);
                                const githubTask = yield db.GitHubTask.findOne({where: {projectId: project.id, taskId: tasks[0].id}});
                                expect(githubTask).to.have.property('number', String(body.issue.number));
                            })));
                    };
                    const createTask = ({stageName, user, title, body, labels} = {}) => co(function* () {
                        task = yield Task.create(project.id, {
                            title: title || 'testTitle',
                            body: body || 'testBody',
                            stageId: stageName ? _.find(project.stages, {name: stageName}).id : null,
                            userId: user ? user.id : null,
                            labelIds: _.map(labels || [], 'id')
                        });
                        yield db.GitHubTask.create({projectId: project.id, taskId: task.id, number: 1});
                    });
                    const taskStageShouldBe = stageName => Task.findById(task.id)
                        .then(_task => expect(_task).to.have.deep.property('stage.name', stageName));
                    const taskUserShouldBe = username => Task.findById(task.id)
                        .then(_task => {
                            if (username) {
                                expect(_task).to.have.deep.property('user.username', username);
                            } else {
                                expect(_task.user).to.be.null;
                            }
                        });
                    const taskContentShouldBe = (_title, _body) => Task.findById(task.id)
                        .then(_task => {
                            expect(_task).to.have.property('title', _title);
                            expect(_task).to.have.property('body', _body);
                        });
                    const taskLabelsShouldBe = (labels) => Task.findById(task.id)
                        .then(_task => {
                            expect(_.map(_task.labels, 'name')).to.have.members(_.map(labels, 'name'));
                        });

                    before(() => {
                        socketProjectStub = sinon.stub(GitHubAddonIssueHook, 'socketProject');
                        socketProjectStub.returns({emits: () => Promise.resolve(), notifyText: () => Promise.resolve()});
                    });
                    after(() => {
                        socketProjectStub.restore();
                    });

                    context('with not exists project', () => {
                        it('should return 404', () => requestWrap('invalidProjectId', {})
                            .expect(404)
                            .expect(res => {
                                expect(res.body).to.have.property('message').that.match(/project was not found/);
                            }));
                    });

                    describe('opened', () => {
                        before(() => {
                            body = JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/hook_issues_opened.json`));
                        });

                        context('with not exists task', shouldCreateNewTask);

                        context('with exists task', () => {
                            beforeEach(() => createTask());

                            it('should not create task', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/already created/);
                                    return Task.findAll(project.id, {include: []})
                                        .then(tasks => {
                                            expect(tasks).to.lengthOf(1);
                                        });
                                }));
                        });
                    });

                    describe('reopened', () => {
                        before(() => {
                            body = JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/hook_issues_reopened.json`));
                        });

                        context('with not exists task', shouldCreateNewTask);

                        context('with already opened task', () => {
                            beforeEach(() => createTask({stageName: 'issue'}));

                            it('should no change stage', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/no changed/);
                                    taskStageShouldBe('issue');
                                }));
                        });

                        context('with closed task', () => {
                            context('with assigned task', () => {
                                beforeEach(() => co(function* () {
                                    body.issue.assignee = {login: project.users[0].username};
                                    yield createTask({stageName: 'done'});
                                }));
                                afterEach(() => {
                                    body.issue.assignee = null;
                                });

                                it('should update stage to todo', () => requestWrap(project.id, body)
                                    .expect(200)
                                    .expect(res => {
                                        expect(res.body).property('message').that.match(/updated/);
                                        taskStageShouldBe('todo');
                                    }));
                            });

                            context('with unassigned task', () => {
                                beforeEach(() => createTask({stageName: 'done'}));

                                it('should update stage to issue', () => requestWrap(project.id, body)
                                    .expect(200)
                                    .expect(res => {
                                        expect(res.body).property('message').that.match(/updated/);
                                        taskStageShouldBe('issue');
                                    }));
                            });
                        });
                    });

                    describe('closed', () => {
                        before(() => {
                            body = JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/hook_issues_closed.json`));
                        });

                        context('with not exists task', shouldCreateNewTask);

                        context('with already closed task', () => {
                            beforeEach(() => createTask({stageName: 'archive'}));

                            it('should no change', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/no changed/);
                                    taskStageShouldBe('archive');
                                }));
                        });

                        context('with opened task', () => {
                            beforeEach(() => createTask({stageName: 'issue'}));

                            it('should update stage to done', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/updated/);
                                    taskStageShouldBe('done');
                                }));
                        });
                    });

                    describe('edited', () => {
                        before(() => {
                            body = JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/hook_issues_edited.json`));
                        });

                        context('with not exists task', shouldCreateNewTask);

                        context('with same title and body', () => {
                            beforeEach(() => createTask({title: body.issue.title, body: body.issue.body}));

                            it('should no change', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/no changed/);
                                }));
                        });

                        context('with different title and body', () => {
                            beforeEach(() => createTask({title: 'old title', body: 'old body'}));

                            it('should update content', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/updated/);
                                    taskContentShouldBe(body.issue.title, body.issue.body);
                                }));
                        });
                    });

                    describe('assigned', () => {
                        before(() => {
                            body = JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/hook_issues_assigned.json`));
                            body.issue.assignee = {login: project.users[0].username};
                        });

                        context('with not exists task', shouldCreateNewTask);

                        context('with same assigned task', () => {
                            beforeEach(() => createTask({stageName: 'todo', user: project.users[0]}));

                            it('should no change', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/no changed/);
                                    taskUserShouldBe(project.users[0].username);
                                }));
                        });

                        context('with other assigned task', () => {
                            beforeEach(() => createTask({user: project.users[1]}));

                            it('should update assignee', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/updated/);
                                    taskUserShouldBe(project.users[0].username);
                                }));
                        });

                        context('with unassigned task', () => {
                            beforeEach(() => createTask());

                            it('should update assignee', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/updated/);
                                    taskUserShouldBe(project.users[0].username);
                                }));
                        });
                    });

                    describe('unassigned', () => {
                        before(() => {
                            body = JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/hook_issues_unassigned.json`));
                        });

                        context('with not exists task', shouldCreateNewTask);

                        context('with unassigned task', () => {
                            beforeEach(() => createTask());

                            it('should no change', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/no changed/);
                                    taskUserShouldBe(null);
                                }));
                        });

                        context('with assigned task', () => {
                            beforeEach(() => createTask({stageName: 'todo', user: project.users[0]}));

                            it('should unassign', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/updated/);
                                    taskUserShouldBe(null);
                                }));
                        });
                    });

                    // TODO: test with new create label task
                    describe('labeled', () => {
                        before(() => {
                            body = JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/hook_issues_labeled.json`));
                            body.issue.labels = project.labels.slice(0, 2).map(label => _.pick(label, ['name', 'color']));
                        });

                        context('with not exists task', shouldCreateNewTask);

                        context('with labels', () => {
                            beforeEach(co.wrap(function*() {
                                yield createTask({labels: [project.labels[1]]});
                            }));

                            it('should update task labels', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/updated/);
                                    taskLabelsShouldBe(project.labels.slice(0, 2));
                                }));
                        });
                    });
                    describe('unlabeled', () => {
                        before(() => {
                            body = JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/hook_issues_unlabeled.json`));
                            body.issue.labels = [project.labels[0], project.labels[2]].map(label => _.pick(label, ['name', 'color']));
                        });

                        context('with not exists task', shouldCreateNewTask);

                        context('with labels', () => {
                            beforeEach(co.wrap(function*() {
                                yield createTask({labels: project.labels.slice(0, 3)});
                            }));

                            it('should update task labels', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/updated/);
                                    taskLabelsShouldBe([project.labels[0], project.labels[2]]);
                                }));
                        });
                    });
                });
            });
        });
    });
});
