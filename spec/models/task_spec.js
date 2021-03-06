'use strict';
const _ = require('lodash');
const helper = require('../helper');
const db = require('../../lib/schemes');
const Project = require('../../lib/models/project');
const Task = require('../../lib/models/task');
const expect = helper.expect;


describe('models', () => {
    describe('task', () => {
        const usernames = ['owner', 'user1'];
        const taskTitles = ['task1', 'task2', 'task3', 'task4', 'task5'];
        let project, project2;

        after(() => helper.db.clean());
        before(async () => {
            project = await Project.create('project1', usernames[0], {include: [
                {model: db.User, as: 'users'},
                {model: db.Stage, as: 'stages', separate: true},
                {model: db.Cost, as: 'costs', separate: true},
                {model: db.Label, as: 'labels'}
            ]});
            project2 = await Project.create('project1', usernames[0]);
        });
        beforeEach(async () => {
            await Task.create(project2.id, {title: 'other project task1', body: ''});
            await Task.create(project2.id, {title: 'other project task2', body: ''});
            await Task.create(project2.id, {title: 'other project task3', body: ''});
        });
        afterEach(() => db.Task.destroy({where: {}}));

        it('project should have no task', () => expectTaskSize(project.id, 0));

        describe('#create', () => {
            context('with default value', () => {
                let task;
                beforeEach(async () => {
                    task = await Task.create(project.id, {title: taskTitles[0], body: 'body1'});
                });

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
                beforeEach(async () => {
                    task = await Task.create(project.id, {
                        title: taskTitles[0],
                        body: 'body1',
                        userId: project.users[0].id,
                        stageId: project.stages[2].id,
                        costId: project.costs[1].id,
                        labelIds: project.labels.slice(0, 2).map(x => x.id)
                    });
                });

                it('project should have 2 tasks', () => expectTaskSize(project.id, 1));
                it('should set params', () => {
                    expect(task).to.have.property('title', taskTitles[0]);
                    expect(task).to.have.property('body', 'body1');
                    expect(task).to.have.property('userId', project.users[0].id);
                    expect(task).to.have.property('stageId', project.stages[2].id);
                    expect(task).to.have.property('costId', project.costs[1].id);
                    expect(task.labels.map(x => x.id)).to.to.include.members(project.labels.slice(0, 2).map(x => x.id));
                });
            });

            context('with not exists stage', () => {
                it('should throw error', () => expect(Task.create(project.id, {title: taskTitles[0], body: 'body1', stageId: -1}))
                    .to.be.rejectedWith(/stage was not found/));
            });

            context('with assigned stage and null user', () => {
                let stageId;
                let userId = null;
                beforeEach(() => { stageId = project.stages.find(x => x.assigned).id; });

                it('should throw error', () => expect(Task.create(project.id, {title: taskTitles[0], body: 'body1', stageId, userId}))
                    .to.be.rejectedWith(/no assignment is invalid/));
            });

            context('with not assigned stage and user', () => {
                let stageId;
                let userId = null;
                beforeEach(() => {
                    stageId = project.stages.find(x => !x.assigned).id;
                    userId = project.users[0].id;
                });

                it('should throw error', () => expect(Task.create(project.id, {title: taskTitles[0], body: 'body1', stageId, userId}))
                    .to.be.rejectedWith(/assignment is invalid/));
            });
        });

        describe('#create x 5', () => {
            let tasks;
            beforeEach(async () => {
                tasks = [];
                for (let title of taskTitles) {
                    const task = await Task.create(project.id, {title, body: `body of ${title}`});
                    tasks.push(task);
                }
            });

            it('project should have 5 tasks', () => expectTaskSize(project.id, 5));

            describe('#archive', () => {
                beforeEach(() => Task.archive(project.id, tasks[1].id));

                it('the stage of archived task should be archive', async () => {
                    const _tasks = await Task.findAll(project.id);
                    _tasks.forEach(task => {
                        if (task.id === tasks[1].id) {
                            expect(task).to.have.deep.property('stage.name', 'archive');
                        } else {
                            expect(task).to.have.not.deep.property('stage.name', 'archive');
                        }
                    });
                });

                context('not exists archive stage', () => {
                    beforeEach(() => db.Stage.destroy({where: project.stages.find(x => x.name === 'archive')}));

                    it('should throw error', () =>
                        expect(Task.archive(project.id, tasks[1].id)).to.be.rejectedWith(/archive/));
                });
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
                        expect(task).to.have.property(k, v);
                    });
                }));
            });

            describe('#updateStatus', () => {
                beforeEach(() => Task.updateStatus(project.id, tasks[1].id, {userId: null, stageId: project.stages[1].id}));

                it('should be updated', () => Task.findById(tasks[1].id).then(task => {
                    expect(task).to.have.property('stageId', project.stages[1].id);
                    expect(task).to.have.property('userId', null);
                }));

                context('given not exists task', () => {
                    it('should throw error', () =>
                        expect(Task.updateStatus(project.id, -1, {userId: null, stageId: project.stages[1].id}))
                            .to.be.rejectedWith(/task was not found/));
                });

                context('given working task', () => {
                    let taskId;
                    beforeEach(() => {
                        taskId = tasks[1].id;
                        return db.Task.update({isWorking: true}, {where: {id: taskId}});
                    });

                    it('should throw error', () =>
                        expect(Task.updateStatus(project.id, taskId, {userId: null, stageId: project.stages[1].id}))
                            .to.be.rejectedWith(/working task/));
                });
            });

            describe('#updateWorkingState', () => {
                let task;

                context('start work', () => {
                    beforeEach(async () => {
                        await Task.updateStatus(project.id, tasks[1].id, {
                            userId: project.users[0].id,
                            stageId: _.find(project.stages, {canWork: true}).id
                        });
                        await Task.updateWorkingState(project.id, tasks[1].id, true);
                        task = await Task.findById(tasks[1].id);
                    });

                    it('should be started work', () => expect(task).to.have.property('isWorking', true));
                    it('should create a new work', () => {
                        expect(task.works).to.lengthOf(1);
                        expect(task).to.have.deep.property('works[0].isEnded', false);
                        expect(task).to.have.deep.property('works[0].startTime').that.be.a('date');
                        expect(task).to.have.deep.property('works[0].endTime', null);
                        expect(task).to.have.deep.property('works[0].userId', project.users[0].id);
                    });

                    context('and stop work', () => {
                        beforeEach(async () => {
                            await Task.updateWorkingState(project.id, tasks[1].id, false);
                            task = await Task.findById(tasks[1].id);
                        });

                        it('should be stopped work', () => expect(task).to.have.property('isWorking'), false);
                        it('the work should be ended', () => {
                            expect(task.works).to.lengthOf(1);
                            expect(task).to.have.deep.property('works[0].isEnded', true);
                            expect(task).to.have.deep.property('works[0].endTime').that.be.a('date');
                        });
                    });
                });

                context('on cannot work stage', () => {
                    let taskId;
                    beforeEach(() => {
                        taskId = tasks[1].id;
                        const stage = project.stages.find(x => !x.canWork);
                        return db.Task.update({stageId: stage.id}, {where: {id: taskId}});
                    });

                    it('should throw error', () => expect(Task.updateWorkingState(project.id, taskId, true))
                        .to.be.rejectedWith(/on cannot work/));
                });

                context('not exists work and stop work', () => {
                    let taskId;
                    beforeEach(() => {
                        taskId = tasks[1].id;
                        return Task.updateStatus(project.id, taskId, {
                            userId: project.users[0].id,
                            stageId: _.find(project.stages, {canWork: true}).id
                        });
                    });

                    it('should throw error', () => expect(Task.updateWorkingState(project.id, taskId, false))
                        .to.be.rejectedWith(/work was not found/));
                });
            });

            describe('#updateWorkHistory', () => {
                let task;
                let works;

                context('with valid params', () => {
                    beforeEach(async () => {
                        let taskId = tasks[1].id;
                        let userId = project.users[0].id;
                        let stageId = project.stages.find(x => x.canWork).id;
                        works = [
                            {isEnded: true, startTime: Date.now(), endTime: Date.now(), userId, taskId, stageId},
                            {isEnded: true, startTime: Date.now(), endTime: Date.now(), userId, taskId, stageId},
                            {isEnded: true, startTime: Date.now(), endTime: Date.now(), userId, taskId, stageId}
                        ];
                        await Task.updateWorkHistory(project.id, taskId, works);
                        task = await Task.findById(taskId);
                    });

                    it('should replace to the works', () => {
                        expect(task.works).to.lengthOf(3);
                    });

                    context('and do one', () => {
                        beforeEach(async () => {
                            works.splice(1, 1); // length of works is 2
                            await Task.updateWorkHistory(project.id, task.id, works);
                            task = await Task.findById(task.id);
                        });

                        it('should replace to the new works', () => {
                            expect(task.works).to.lengthOf(2);
                        });
                    });
                });

                context('with invalid params', () => {
                    it('should throw error', () => expect(Task.updateWorkHistory(project.id, tasks[1].id, [{}]))
                        .to.be.rejectedWith(/invalid parameter/));
                });
            });

            describe('#getAllSorted', () => {
                let tasks;
                beforeEach(() => Task.getAllSorted(project.id).then(xs => { tasks = xs; }));
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
                            beforeEach(async () => {
                                ids = _.map(await Task.getAllSorted(project.id), 'id');
                                const target = ids[from];
                                const before = ids[to];
                                ids.splice(from, 1);
                                ids.splice(ids.indexOf(before), 0, target);
                                await Task.updateOrder(project.id, target, before);
                            });

                            it('should be ordered', () => expectOrder(project.id, ids));
                        });
                    });
                    context(`update position from ${from} to last`, () => {
                        let ids;
                        beforeEach(async () => {
                            ids = _.map(await Task.getAllSorted(project.id), 'id');
                            const target = ids.splice(from, 1)[0];
                            ids.push(target);
                            await Task.updateOrder(project.id, target, null);
                        });

                        it('should be ordered', () => expectOrder(project.id, ids));
                    });
                });

                context('with taskId equals beforeTaskId', () => {
                    it('should throw error', () => expect(Task.updateOrder(project.id, tasks[1].id, tasks[1].id))
                        .to.eventually.have.property('updated', false));
                });

                context('with not exists taskId', () => {
                    it('should throw error', () => expect(Task.updateOrder(project.id, -1, tasks[1].id))
                        .to.be.rejectedWith(/was not found/));
                });

                context('with not exists beforeTaskId', () => {
                    it('should throw error', () => expect(Task.updateOrder(project.id, tasks[1].id, -1))
                        .to.be.rejectedWith(/was not found/));
                });

                context('with random update order and create', () => {
                    it('should be ordered', async () => {
                        const ids = _.map(await Task.getAllSorted(project.id), 'id');
                        for (let i = 0; i < 10; i++) {
                            if (_.random(5)) {
                                const from = _.random(0, ids.length - 1);
                                const to = _.random(3) ? _.random(0, 4) : null;
                                const target = ids[from];
                                const before = _.isNumber(to) ? ids[to] : null;
                                if (from !== to) {
                                    if (_.isNumber(to)) {
                                        ids.splice(from, 1);
                                        ids.splice(ids.indexOf(before), 0, target);
                                    } else {
                                        ids.splice(from, 1);
                                        ids.push(target);
                                    }
                                }
                                await Task.updateOrder(project.id, target, before);
                            } else {
                                const newTask = await Task.create(project.id, {title: '', body: ''});
                                ids.unshift(newTask.id);
                            }

                            await expectOrder(project.id, ids);
                        }
                    });
                });
            });

            describe('#updateStatusAndOrder', () => {
                let ids, target, before;
                beforeEach(async () => {
                    ids = _.map(await Task.getAllSorted(project.id), 'id');
                    target = ids[1];
                    before = ids[2];
                    ids.splice(1, 1);
                    ids.splice(ids.indexOf(before), 0, target);
                    await Task.updateStatusAndOrder(project.id, target, before, {userId: null, stageId: project.stages[1].id});
                });

                it('should be updated', () => Task.findById(target).then(task => {
                    expect(task).to.have.property('stageId', project.stages[1].id);
                    expect(task).to.have.property('userId', null);
                }));

                it('should be ordered', () => expectOrder(project.id, ids));
            });
        });
    });
});

function expectTaskSize (projectId, n) {
    return db.Project.findById(projectId, {include: [db.Task]}).then(p => {
        expect(p.tasks).to.lengthOf(n);
    });
}

function expectOrder (projectId, ids) {
    return Task.getAllSorted(projectId).then(tasks => {
        tasks.forEach(({id, prevTaskId, nextTaskId}, idx) => {
            expect(id).to.equal(ids[idx]);
            expect(prevTaskId).to.equal(idx ? ids[idx - 1] : null);
            expect(nextTaskId).to.equal(idx + 1 < ids.length ? ids[idx + 1] : null);
        });
    });
}
