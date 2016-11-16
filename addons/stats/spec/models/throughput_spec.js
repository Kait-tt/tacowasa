'use strict';
const _ = require('lodash');
const co = require('co');
const Throughput = require('../../models/throughput');
const db = require('../../schemas');
const Project = require('../../../../lib/models/project');
const Task = require('../../../../lib/models/task');
const Member = require('../../../../lib/models/member');
const helper = require('../../../../spec/helper');
const expect = helper.expect;
const EPS = 1e-6;

describe('addons', () => {
    describe('stats', () => {
        describe('models', () => {
            describe('throughput', () => {
                let project;
                let userIds;
                let stageIds;
                let costIds;

                before(co.wrap(function* () {
                    const _project = yield Project.create('project1', 'user1');
                    yield Member.add(_project.id, 'user2');
                    project = yield Project.findById(_project.id);
                    userIds = project.users.map(x => x.id);
                    stageIds = {};
                    project.stages.forEach(x => { stageIds[x.name] = x.id; });
                    costIds = {};
                    project.costs.forEach(x => { costIds[x.value] = x.id; });
                }));
                after(() => helper.db.clean());
                afterEach(co.wrap(function* () {
                    yield db.Work.destroy({where: {}});
                    yield db.Task.destroy({where: {}});
                    yield db.ProjectStats.destroy({where: {}});
                    yield db.MemberStats.destroy({where: {}});
                }));

                describe('#calcAll', () => {
                    context('with no task', () => {
                        let subject;
                        beforeEach(() => Throughput.calcAll(project.id).then(x => { subject = x; }));

                        it('should return throughput of 0', () => {
                            expect(subject[0]).to.have.property('throughput', 0);
                        });
                    });

                    context('with some no worked tasks', () => {
                        let subject;
                        beforeEach(co.wrap(function* () {
                            for (let i = 0; i < 5; i++) {
                                yield Task.create(project.id, {title: '', body: ''});
                            }
                            subject = yield Throughput.calcAll(project.id);
                        }));

                        it('should return throughput of 0', () => {
                            expect(subject[0]).to.have.property('throughput', 0);
                        });
                    });

                    context('with some worked tasks', () => {
                        let subject;
                        beforeEach(co.wrap(function* () {
                            const taskParams = {title: '', body: '', userId: userIds[0], stageId: stageIds['doing']};

                            // worked for 90 minutes on cost 3
                            const task1 = yield Task.create(project.id, _.assign({costId: costIds[3]}, taskParams));
                            yield createWork(task1.id, userIds[0], {minutes: 60, offset: 120});
                            yield createWork(task1.id, userIds[0], {minutes: 30, offset: 0});

                            // worked for 120 minutes on cost 5
                            const task2 = yield Task.create(project.id, _.assign({costId: costIds[5]}, taskParams));
                            yield createWork(task2.id, userIds[0], {minutes: 120, offset: 3000});

                            yield changeStageTasks([task1, task2], stageIds['done']);

                            subject = yield Throughput.calcAll(project.id);
                        }));

                        it('should return throughput of calculated value', () => {
                            const v = (3 + 5) / (90 + 120) * 60;
                            expect(subject.find(x => x.userId === userIds[0]).throughput).to.within(v - EPS, v + EPS);
                        });
                    });

                    context('with worked task and working task', () => {
                        let subject;
                        beforeEach(co.wrap(function* () {
                            const taskParams = {title: '', body: '', userId: userIds[0], stageId: stageIds['doing']};

                            // worked for 90 minutes on cost 3
                            const task1 = yield Task.create(project.id, _.assign({costId: costIds[3]}, taskParams));
                            yield createWork(task1.id, userIds[0], {minutes: 90, offset: 100});

                            // working task
                            const task2 = yield Task.create(project.id, _.assign({costId: costIds[5]}, taskParams));
                            yield createWork(task2.id, userIds[0], {minutes: 120, offset: 3000});

                            yield changeStageTasks([task1], stageIds['done']);

                            subject = yield Throughput.calcAll(project.id);
                        }));

                        it('should return throughput of calculated value ignore working task', () => {
                            const v = 3 / 90 * 60;
                            expect(subject.find(x => x.userId === userIds[0]).throughput).to.within(v - EPS, v + EPS);
                        });
                    });

                    context('with some worked tasks and members', () => {
                        let subject;
                        let vs;
                        beforeEach(co.wrap(function* () {
                            vs = {};
                            const taskParams = {title: '', body: '', stageId: stageIds['doing']};

                            // worked for 90 minutes on cost 3
                            const task1 = yield Task.create(project.id, _.assign({costId: costIds[3], userId: userIds[0]}, taskParams));
                            yield createWork(task1.id, userIds[0], {minutes: 90, offset: 100});
                            vs[userIds[0]] = 3 / 90 * 60;

                            // worked for 120 minutes on cost 5
                            const task2 = yield Task.create(project.id, _.assign({costId: costIds[5], userId: userIds[1]}, taskParams));
                            yield createWork(task2.id, userIds[1], {minutes: 120, offset: 3000});
                            vs[userIds[1]] = 5 / 120 * 60;

                            yield changeStageTasks([task1, task2], stageIds['done']);

                            subject = yield Throughput.calcAll(project.id);
                        }));

                        it('should return throughput of calculated value for each users', () => {
                            userIds.forEach(userId => {
                                const throughput = subject.find(x => x.userId === userId).throughput;
                                const v = vs[userId];
                                expect(throughput).to.within(v - EPS, v + EPS);
                            });
                        });

                        it('should save throughput', co.wrap(function* () {
                            for (let [userId, throughput] of _.toPairs(vs)) {
                                const member = yield db.Member.findOne({where: {projectId: project.id, userId}});
                                const stats = yield db.MemberStats.findOne({where: {memberId: member.id}});
                                expect(stats.throughput).to.within(throughput - EPS, throughput + EPS);
                            }
                        }));
                    });
                });
            });
        });
    });
});

function createWork (taskId, userId, {minutes = 0, offset = 0, isEnded = true}) {
    const now = Date.now();
    return db.Work.create({
        taskId,
        userId,
        isEnded,
        startTime: now - (minutes + offset) * 60 * 1000,
        endTime: now - offset * 60 * 1000
    });
}

function changeStageTasks (tasks, stageId) {
    return co(function* () {
        for (let {id} of tasks) {
            yield db.Task.update({stageId}, {where: {id}});
        }
    });
}
