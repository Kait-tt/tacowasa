'use strict';
const expect = require('chai').expect;
const _ = require('lodash');
const co = require('co');
const helper = require('../helper');
const db = require('../../schemes');
const Project = require('../../models/project');
const Task = require('../../models/task');

afterEach(() => helper.db.clean());

describe('models', () => {
    describe('task', () => {
        const usernames = ['owner', 'user1'];
        const taskTitles = ['task1', 'task2', 'task3', 'task4', 'task5'];
        let project;

        beforeEach(() => Project.create('project1', usernames[0]).then(x => project = x));

        it('project should have no task', () => expectTaskSize(project.id, 0));

        describe('#create', () => {
            context('with default value', () => {
                let task;
                beforeEach(() => Task.create(project.id, {title: taskTitles[0], body: 'body1'}).then(x => task = x));

                it('project should have 2 tasks', () => expectTaskSize(project.id, 1));
                it('should set params', () => {
                    expect(task).to.have.property('title', taskTitles[0]);
                    expect(task).to.have.property('body', 'body1');
                    expect(task).to.have.property('userId', null);
                    expect(task).to.have.property('stageId', project.defaultStageId);
                    expect(task).to.have.property('costId', project.defaultCostId);
                });
            });

            context('with specified value', () => {
                let task;
                beforeEach(() => Task.create(project.id, {
                    title: taskTitles[0],
                    body: 'body1',
                    userId: project.users[0].id,
                    stageId: project.stages[2].id,
                    costId: project.costs[1].id
                }).then(x => task = x));

                it('project should have 2 tasks', () => expectTaskSize(project.id, 1));
                it('should set params', () => {
                    expect(task).to.have.property('title', taskTitles[0]);
                    expect(task).to.have.property('body', 'body1');
                    expect(task).to.have.property('userId', project.users[0].id);
                    expect(task).to.have.property('stageId', project.stages[2].id);
                    expect(task).to.have.property('costId', project.costs[1].id);
                });
            });
        });

        describe('#create x 5', () => {
            let tasks;
            beforeEach(() => co(function* () {
                tasks = [];
                for (let title of taskTitles) {
                    let task = yield Task.create(project.id, {title, body: `body of ${title}`});
                    tasks.push(task);
                }
            }));

            it('project should have 5 tasks', () => expectTaskSize(project.id, 5));

            describe('#archive', () => {
                beforeEach(() => Task.archive(project.id, tasks[1].id));

                it('the stage of archived task should be archive', () => co(function* () {
                    const _tasks = yield Task.findAll(project.id);
                    _tasks.forEach(task => {
                        if (task.id === tasks[1].id) {
                            expect(task).to.have.deep.property('stage.name', 'archive');
                        } else {
                            expect(task).to.have.not.deep.property('stage.name', 'archive');
                        }
                    });
                }));
            });

            describe('#updateContent', () => {
                let updateParams;
                beforeEach(() => {
                    updateParams = {
                        title: 'updated title',
                        body: 'updated body',
                        costId: project.costs[2].id
                    };
                    return Task.updateContent(project.id, tasks[1].id, updateParams);
                });

                it('should be updated', () => Task.findById(tasks[1].id).then(task => {
                    _.forEach(updateParams, (v, k) => {
                        expect(task).to.have.property(k ,v);
                    });
                }));
            });

            describe('#updateStatus', () => {
                beforeEach(() => Task.updateStatus(project.id, tasks[1].id, {userId: null, stageId: project.stages[1].id}));

                it('should be updated', () => Task.findById(tasks[1].id).then(task => {
                    expect(task).to.have.property('stageId', project.stages[1].id);
                    expect(task).to.have.property('userId', null);
                }));
            });

            describe('#updateWorkingState', () => {
                let task;

                context('start work', () => {
                    beforeEach(() => co(function* () {
                        yield Task.updateStatus(project.id, tasks[1].id, {
                            userId: project.users[0].id,
                            stageId: _.find(project.stages, {canWork: true}).id
                        });
                        yield Task.updateWorkingState(project.id, tasks[1].id, true);
                        task = yield Task.findById(tasks[1].id);
                    }));

                    it('should be started work', () => expect(task).to.have.property('isWorking', true));
                    it('should create a new work', () => {
                        expect(task.works).to.lengthOf(1);
                        expect(task).to.have.deep.property('works[0].isEnded', false);
                        expect(task).to.have.deep.property('works[0].startTime').that.be.a('date');
                        expect(task).to.have.deep.property('works[0].endTime', null);
                        expect(task).to.have.deep.property('works[0].userId', project.users[0].id);
                    });

                    context('and stop work', () => {
                        beforeEach(() => co(function* () {
                            yield Task.updateWorkingState(project.id, tasks[1].id, false);
                            task = yield Task.findById(tasks[1].id);
                        }));

                        it('should be stopped work', () => expect(task).to.have.property('isWorking'), false);
                        it('the work should be ended', () => {
                            expect(task.works).to.lengthOf(1);
                            expect(task).to.have.deep.property('works[0].isEnded', true);
                            expect(task).to.have.deep.property('works[0].endTime').that.be.a('date');
                        });
                    });
                });
            });

            describe('#updateWorkHistory', () => {
                let task;
                let works;

                beforeEach(() => co(function* () {
                    let taskId = tasks[1].id;
                    let userId = project.users[0].id;
                    works = [
                        {isEnded: true, startTime: Date.now(), endTime: Date.now(), userId, taskId},
                        {isEnded: true, startTime: Date.now(), endTime: Date.now(), userId, taskId},
                        {isEnded: true, startTime: Date.now(), endTime: Date.now(), userId, taskId}
                    ];
                    yield Task.updateWorkHistory(project.id, taskId, works);
                    task = yield Task.findById(taskId);
                }));

                it('should replace to the works', () => {
                    expect(task.works).to.lengthOf(3);
                });

                context('and do one', () => {
                    beforeEach(() => co(function* () {
                        works.splice(1,1); // length of works is 2
                        yield Task.updateWorkHistory(project.id, task.id, works);
                        task = yield Task.findById(task.id);
                    }));

                    it('should replace to the new works', () => {
                        expect(task.works).to.lengthOf(2);
                    });
                });
            });

            describe('#getAllSorted', () => {
                let tasks;
                beforeEach(() => Task.getAllSorted(project.id).then(xs => tasks = xs));
                it('should be sorted', () => {
                    const titles = _.reverse(taskTitles.slice());
                    expect(_.map(tasks, 'title')).to.eql(titles);
                });
            });

            describe('#updateOrder', () => {
                let n = 5;

                _.times(n, from => {
                    _.times(n, to => {
                        if (from === to) return;
                        context(`update position from ${from} to ${to}`, () => {
                            let ids;
                            beforeEach(() => co(function* () {
                                ids = _.map(yield Task.getAllSorted(project.id), 'id');
                                const target = ids[from];
                                const before = ids[to];
                                ids.splice(from, 1);
                                ids.splice(ids.indexOf(before), 0, target);
                                yield Task.updateOrder(project.id, target, before);
                            }));

                            it(`should be ordered`, () => Task.getAllSorted(project.id).then(tasks => {
                                expect(_.map(tasks, 'id')).to.eql(ids);
                            }));
                        });
                    });
                    context(`update position from ${from} to last`, () => {
                        let ids;
                        beforeEach(() => co(function* () {
                            ids = _.map(yield Task.getAllSorted(project.id), 'id');
                            const target = ids.splice(from, 1)[0];
                            ids.push(target);
                            yield Task.updateOrder(project.id, target, null);
                        }));

                        it(`should ordered`, () => Task.getAllSorted(project.id).then(tasks => {
                            expect(_.map(tasks, 'id')).to.eql(ids);
                        }));
                    });
                });
            });
        });
    });
});

function expectTaskSize(projectId, n) {
    return db.Project.findById(projectId, {include: [db.Task]}).then(p => {
        expect(p.tasks).to.lengthOf(n);
    });
}