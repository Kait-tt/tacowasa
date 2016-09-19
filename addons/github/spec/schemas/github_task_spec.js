'use strict';
const expect = require('chai').expect;
const helper = require('../../../../spec/helper');
const db = require('../../schemas');

afterEach(() => helper.db.clean());

describe('schemes', () => {
    describe('githubTask', () => {
        describe('#create', () => {
            let user, project, stage, cost, task;

            beforeEach(() => {
                return db.User.create({username: 'user1'}).then(x => user = x)
                    .then(user => db.Project.create({name: 'project1', createUserId: user.id}).then(x => project = x))
                    .then(() => db.Stage.create({name: 'todo', displayName: 'ToDo', assigned: true, projectId: project.id}).then(x => stage = x))
                    .then(() => db.Cost.create({name: 'medium', value: 3, projectId: project.id}).then(x => cost = x))
                    .then(() => db.Task.create({
                        projectId: project.id, stageId: stage.id, userId: user.id, costId: cost.id,
                        title: 'title1', body: 'body1', isWorking: true
                    }).then(x => task = x))
                    .then(() => db.GitHubTask.create({
                        taskId: task.id, number: 111, isPullRequest: true
                    }));
            });

            it('should create a new github task', () => {
                return db.GitHubTask.findAll().then(_gtasks => {
                    expect(_gtasks).to.have.lengthOf(1);
                    expect(_gtasks[0]).to.have.property('number', '111');
                    expect(_gtasks[0]).to.have.property('isPullRequest', true);
                });
            });
        });
    });
});