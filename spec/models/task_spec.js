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

        describe('#add', () => {
            context('with default value', () => {
                let task;
                beforeEach(() => Task.add(project.id, {title: taskTitles[0], body: 'body1'}).then(x => task = x));

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
                beforeEach(() => Task.add(project.id, {
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

        describe('#add x 5', () => {
            let tasks;
            beforeEach(() => co(function* () {
                tasks = [];
                for (let title of taskTitles) {
                    let task = yield Task.add(project.id, {title, body: `body of ${title}`});
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

                it('should be updated', () => Task.findById(project.id, tasks[1].id).then(task => {
                    _.forEach(updateParams, (v, k) => {
                        expect(task).to.have.property(k ,v);
                    });
                }));
            });
        });
    });
});

function expectTaskSize(projectId, n) {
    return db.Project.findById(projectId, {include: [db.Task]}).then(p => {
        expect(p.tasks).to.lengthOf(n);
    });
}