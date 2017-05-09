'use strict';
const sinon = require('sinon');
const helper = require('../../../../spec/helper');
const expect = helper.expect;
const _ = require('lodash');
const db = require('../../schemas');
const Project = require('../../../../lib/models/project');
const Task = require('../../../../lib/models/task');
const GitHubApi = require('../../models/github_api');

describe('addons', () => {
    describe('github', () => {
        describe('models', () => {
            describe('GitHubApi', () => {
                describe('#syncAllTasksAndLabelsFromGitHub', () => {
                    let project;
                    let githubApi;
                    let getNextStub;
                    let githubLabels = [
                        {name: 'label1', color: '#00ff00'},
                        {name: 'label2', color: '#0000ff'}
                    ];
                    let githubTasks = [
                        {number: 1, labels: [{name: 'label2'}]},
                        {number: 2, labels: [{name: 'label1'}, {name: 'label2'}]}
                    ];
                    let tasks = [];
                    let res;
                    before(async () => {
                        getNextStub = sinon.stub(GitHubApi, 'getNext', () => null);

                        githubApi = new GitHubApi();
                        githubApi.api = {
                            issues: {
                                getForRepo: () => Promise.resolve(githubTasks),
                                getLabels: () => Promise.resolve(githubLabels)
                            }
                        };

                        project = await Project.create('testProject', 'testUser');
                        await db.GitHubRepository.create({
                            username: 'repoUsername',
                            reponame: 'repoReponame',
                            projectId: project.id
                        });
                        tasks = [];
                        for (let githubTask of githubTasks) {
                            const task = await Task.create(project.id, {
                                title: 'taskTitle',
                                body: 'taskBody',
                                labelIds: _.sampleSize(_.map(project.labels, 'id'), 2)
                            });
                            await db.GitHubTask.create({
                                projectId: project.id,
                                taskId: task.id,
                                number: githubTask.number
                            });
                            tasks.push(task);
                        }
                        res = githubApi.syncAllTasksAndLabelsFromGitHub(project.id);
                        await res;
                    });

                    after(() => {
                        getNextStub.restore();
                        return helper.db.clean();
                    });

                    it('should be resolved', () => expect(res).be.fulfilled);

                    it('should sync project labels', async () => {
                        const labels = await db.Label.findAll({where: {projectId: project.id}});
                        expect(_.map(labels, 'name')).to.have.members(_.map(githubLabels, 'name'));
                    });

                    it('should sync task labels', async () => {
                        for (let i of _.range(githubTasks.length)) {
                            const task = await Task.findById(tasks[i].id);
                            expect(_.map(task.labels, 'name')).to.have.members(_.map(githubTasks[i].labels, 'name'));
                        }
                    });
                });
            });
        });
    });
});
