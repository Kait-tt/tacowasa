'use strict';
const co = require('co');
const expect = require('chai').expect;
const helper = require('../helper');
const db = require('../../lib/schemes');


describe('schemes', () => {
    describe('work', () => {
        afterEach(() => helper.db.clean());

        describe('#create', () => {
            let user, project, stage, cost, task;

            beforeEach(co.wrap(function* () {
                user = yield db.User.create({username: 'user1'});
                project = yield db.Project.create({name: 'project1', createUserId: user.id});
                stage = yield db.Stage.create({
                    name: 'doing',
                    displayName: 'Doing',
                    assigned: true,
                    projectId: project.id,
                    canWork: true
                });
                cost = yield db.Cost.create({name: 'medium', value: 3, projectId: project.id});
                task = yield db.Task.create({
                    projectId: project.id,
                    stageId: stage.id,
                    userId: user.id,
                    costId: cost.id,
                    title: 'title1',
                    body: 'body1',
                    isWorking: true
                });
                yield db.Work.create({userId: user.id, taskId: task.id, stageId: stage.id});
            }));

            it('should create a new work', () => {
                return db.Work.findAll({include: [{all: true, nested: false}]}).then(_works => {
                    expect(_works).to.have.lengthOf(1);
                    expect(_works[0]).to.have.property('isEnded', false);
                    expect(_works[0]).to.have.property('startTime');
                    expect(_works[0]).to.have.property('endTime', null);
                });
            });

            it('the task should have a work', () => {
                return db.Task.findById(task.id, {include: [{model: db.Work}]}).then(_task => {
                    expect(_task.works).to.have.lengthOf(1);
                    expect(_task.works[0]).to.have.property('isEnded', false);
                });
            });
        });
    });
});
