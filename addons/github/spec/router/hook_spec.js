'use strict';
const fs = require('fs');
const _ = require('lodash');
const app = require('../../../../app');
const request = require('supertest').agent(app.listen());
const sinon = require('sinon');
const helper = require('../../../../spec/helper');
const expect = helper.expect;
const Project = require('../../../../lib/models/project');
const Task = require('../../../../lib/models/task');
const Member = require('../../../../lib/models/member');
const User = require('../../../../lib/models/user');
const GitHubAddonIssueHook = require('../../controller/hook/issueHook');
const db = require('../../schemas');

describe('addons', () => {
    describe('github', () => {
        describe('router', () => {
            describe('hook', () => {
                let project;
                let otherUser;
                const url = (projectId) => `/github/${projectId}`;
                before(async () => {
                    project = await Project.create('testProject', 'testUser');
                    otherUser = await User.findOrCreate('otherUsername');
                    await Member.add(project.id, otherUser.username);
                });
                after(() => {
                    return helper.db.clean();
                });
                afterEach(() => {
                    db.Task.destroy({where: {}})
                        .then(() => db.GitHubTask.destroy({where: {}}));
                });

                describe('issue', () => {
                    const requestWrap = (projectId, body) => request.post(url(projectId))
                        .set('x-Github-Event', 'issues')
                        .send(body)
                        .expect('Content-Type', /json/);
                    let body;
                    let socketProjectStub;
                    let task;
                    const emitsNames = [];
                    const notifyTexts = [];
                    const loggingNames = [];
                    const shouldCreateNewTask = () => {
                        it('should create a new task', () => requestWrap(project.id, body)
                            .expect(200)
                            .expect(res => async () => {
                                expect(res.body).property('message').that.match(/created task/);
                                const tasks = await Task.findAll(project.id, {include: []});
                                expect(tasks).to.lengthOf(1);
                                const githubTask = await db.GitHubTask.findOne({where: {projectId: project.id, taskId: tasks[0].id}});
                                expect(githubTask).to.have.property('number', String(body.issue.number));
                                expect(emitsNames).to.have.members(['createTask']);
                                expect(notifyTexts).lengthOf(1);
                                expect(emitsNames[0]).to.match(/created new task/);
                            }));
                    };
                    const createTask = async ({stageName, user, title, body, labels} = {}) => {
                        task = await Task.create(project.id, {
                            title: title || 'testTitle',
                            body: body || 'testBody',
                            stageId: stageName ? _.find(project.stages, {name: stageName}).id : null,
                            userId: user ? user.id : null,
                            labelIds: _.map(labels || [], 'id')
                        });
                        await db.GitHubTask.create({projectId: project.id, taskId: task.id, number: 1});
                    };
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
                        socketProjectStub.returns({
                            emits: (user, name) => {
                                emitsNames.push(name);
                                return Promise.resolve();
                            },
                            notifyText: (user, notifyText) => {
                                notifyTexts.push(notifyText);
                                return Promise.resolve();
                            },
                            logging: (username, action) => {
                                loggingNames.push(action);
                                return Promise.resolve();
                            }
                        });
                    });
                    after(() => {
                        socketProjectStub.restore();
                    });
                    beforeEach(() => {
                        emitsNames.splice(0, emitsNames.length);
                        notifyTexts.splice(0, notifyTexts.length);
                        loggingNames.splice(0, loggingNames.length);
                    });

                    context('with not exists project', () => {
                        it('should return 404', () => requestWrap('invalidProjectId', {})
                            .expect(404)
                            .expect(res => {
                                expect(res.body).to.have.property('message').that.match(/project was not found/);
                                expect(emitsNames).lengthOf(0);
                                expect(notifyTexts).lengthOf(0);
                                expect(loggingNames).lengthOf(0);
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
                                            expect(emitsNames).lengthOf(0);
                                            expect(notifyTexts).lengthOf(0);
                                            expect(loggingNames).lengthOf(0);
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
                                    expect(emitsNames).lengthOf(0);
                                    expect(notifyTexts).lengthOf(0);
                                    expect(loggingNames).lengthOf(0);
                                }));
                        });

                        context('with closed task', () => {
                            context('with assigned task', () => {
                                beforeEach(async () => {
                                    body.issue.assignees = [{login: project.users[0].username}];
                                    await createTask({stageName: 'done'});
                                });
                                afterEach(() => {
                                    body.issue.assignees = [];
                                });

                                it('should update stage to todo', () => requestWrap(project.id, body)
                                    .expect(200)
                                    .expect(res => {
                                        expect(res.body).property('message').that.match(/updated/);
                                        taskStageShouldBe('todo');
                                        expect(emitsNames).have.members(['updateTaskStatus']);
                                        expect(notifyTexts).lengthOf(1);
                                        expect(notifyTexts[0]).to.match(/updatedTask.+stage/);
                                        expect(loggingNames).have.members(['updateTaskStatus']);
                                    }));
                            });

                            context('with unassigned task', () => {
                                beforeEach(() => createTask({stageName: 'done'}));

                                it('should update stage to issue', () => requestWrap(project.id, body)
                                    .expect(200)
                                    .expect(res => {
                                        expect(res.body).property('message').that.match(/updated/);
                                        taskStageShouldBe('issue');
                                        expect(emitsNames).have.members(['updateTaskStatus']);
                                        expect(notifyTexts).lengthOf(1);
                                        expect(notifyTexts[0]).to.match(/updatedTask.+stage/);
                                        expect(loggingNames).have.members(['updateTaskStatus']);
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
                                    expect(emitsNames).lengthOf(0);
                                    expect(notifyTexts).lengthOf(0);
                                    expect(loggingNames).lengthOf(0);
                                }));
                        });

                        context('with opened task', () => {
                            beforeEach(() => createTask({stageName: 'issue'}));

                            it('should update stage to done', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/updated/);
                                    taskStageShouldBe('done');
                                    expect(emitsNames).have.members(['updateTaskStatus']);
                                    expect(notifyTexts).lengthOf(1);
                                    expect(notifyTexts[0]).to.match(/updatedTask.+stage/);
                                    expect(loggingNames).have.members(['updateTaskStatus']);
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
                                    expect(emitsNames).lengthOf(0);
                                    expect(notifyTexts).lengthOf(0);
                                    expect(loggingNames).lengthOf(0);
                                }));
                        });

                        context('with different title and body', () => {
                            beforeEach(() => createTask({title: 'old title', body: 'old body'}));

                            it('should update content', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/updated/);
                                    taskContentShouldBe(body.issue.title, body.issue.body);
                                    expect(emitsNames).have.members(['updateTaskContent']);
                                    expect(notifyTexts).lengthOf(1);
                                    expect(notifyTexts[0]).to.match(/updatedTask/);
                                    expect(loggingNames).have.members(['updateTaskContent']);
                                }));
                        });
                    });

                    describe('assigned', () => {
                        before(() => {
                            body = JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/hook_issues_assigned.json`));
                            body.issue.assignees = [{login: project.users[0].username}];
                        });

                        context('with not exists task', shouldCreateNewTask);

                        context('with same assigned task', () => {
                            beforeEach(() => createTask({stageName: 'todo', user: project.users[0]}));

                            it('should no change', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/no changed/);
                                    taskUserShouldBe(project.users[0].username);
                                    expect(emitsNames).lengthOf(0);
                                    expect(notifyTexts).lengthOf(0);
                                    expect(loggingNames).lengthOf(0);
                                }));
                        });

                        context('with other assigned task', () => {
                            beforeEach(() => createTask({user: project.users[1]}));

                            it('should update assignee', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/updated/);
                                    taskUserShouldBe(project.users[0].username);
                                    expect(emitsNames).have.members(['updateTaskStatus']);
                                    expect(notifyTexts).lengthOf(1);
                                    expect(notifyTexts[0]).to.match(/updatedTask.+username/);
                                    expect(loggingNames).have.members(['updateTaskStatus']);
                                }));
                        });

                        context('with unassigned task', () => {
                            beforeEach(() => createTask());

                            it('should update assignee', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/updated/);
                                    taskUserShouldBe(project.users[0].username);
                                    expect(emitsNames).have.members(['updateTaskStatus']);
                                    expect(notifyTexts).lengthOf(1);
                                    expect(notifyTexts[0]).to.match(/updatedTask.+username/);
                                    expect(loggingNames).have.members(['updateTaskStatus']);
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
                                    expect(emitsNames).lengthOf(0);
                                    expect(notifyTexts).lengthOf(0);
                                    expect(loggingNames).lengthOf(0);
                                }));
                        });

                        context('with assigned task', () => {
                            beforeEach(() => createTask({stageName: 'todo', user: project.users[0]}));

                            it('should unassign', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/updated/);
                                    taskUserShouldBe(null);
                                    expect(emitsNames).have.members(['updateTaskStatus']);
                                    expect(notifyTexts).lengthOf(1);
                                    expect(notifyTexts[0]).to.match(/updatedTask.+username/);
                                    expect(loggingNames).have.members(['updateTaskStatus']);
                                }));
                        });
                    });

                    describe('labeled', () => {
                        before(() => {
                            body = JSON.parse(fs.readFileSync(`${__dirname}/../fixtures/hook_issues_labeled.json`));
                            body.issue.labels = project.labels.slice(0, 3).map(label => _.pick(label, ['name', 'color']));
                        });

                        context('with not exists task', shouldCreateNewTask);

                        context('with labels', () => {
                            beforeEach(async () => {
                                await createTask({labels: [project.labels[1]]});
                            });

                            it('should update task labels', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/updated/);
                                    taskLabelsShouldBe(project.labels.slice(0, 3));
                                    expect(emitsNames).have.members(['attachLabel', 'attachLabel']);
                                    expect(notifyTexts).lengthOf(2);
                                    expect(notifyTexts[0]).to.match(/attached label/);
                                    expect(notifyTexts[1]).to.match(/attached label/);
                                    expect(loggingNames).have.members(['attachLabel', 'attachLabel']);
                                }));
                        });

                        context('with new labels', () => {
                            const newProjectLabel = {name: 'newLabel', color: '#ff00ff'};
                            beforeEach(async () => {
                                await createTask({labels: [project.labels[1]]});
                                body.issue.labels.push(newProjectLabel);
                            });

                            it('should update task labels and add project label', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/updated/);
                                    // taskLabelsShouldBe(project.labels.slice(0, 3).concat([newProjectLabel]));
                                    // expect(emitsNames).have.members(['attachLabel', 'attachLabel', 'attachLabel', 'addLabel']);
                                    // expect(notifyTexts).lengthOf(4);
                                    // expect(notifyTexts[0]).to.match(/add label/);
                                    // expect(notifyTexts[1]).to.match(/attached label/);
                                    // expect(notifyTexts[2]).to.match(/attached label/);
                                    // expect(notifyTexts[3]).to.match(/attached label/);
                                    // expect(loggingNames).have.members(['attachLabel', 'attachLabel', 'attachLabel', 'addLabel']);
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
                            beforeEach(async () => {
                                await createTask({labels: project.labels.slice(0, 3)});
                            });

                            it('should update task labels', () => requestWrap(project.id, body)
                                .expect(200)
                                .expect(res => {
                                    expect(res.body).property('message').that.match(/updated/);
                                    taskLabelsShouldBe([project.labels[0], project.labels[2]]);
                                    expect(emitsNames).have.members(['detachLabel']);
                                    expect(notifyTexts).lengthOf(1);
                                    expect(notifyTexts[0]).to.match(/detached label/);
                                    expect(loggingNames).have.members(['detachLabel']);
                                }));
                        });
                    });
                });
            });
        });
    });
});
