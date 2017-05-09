'use strict';
const sinon = require('sinon');
const config = require('config');
const ProjectStats = require('../../models/project_stats');
const Predictor = require('../../models/predictor');
const db = require('../../schemas');
const Project = require('../../../../lib/models/project');
const helper = require('../../../../spec/helper');
const expect = helper.expect;

describe('addons', () => {
    describe('stats', () => {
        describe('models', () => {
            describe('ProjectStats', () => {
                let project, calcStatStub;

                before(async () => {
                    project = await Project.create('project1', 'user1');
                    calcStatStub = sinon.stub(Predictor, '_execChild');
                    calcStatStub.returns([]);
                });
                after(() => {
                    calcStatStub.restore();
                    return helper.db.clean();
                });

                describe('#calcAll', () => {
                    let subject;

                    beforeEach(async () => {
                        subject = await ProjectStats.calcAll(project.id);
                    });

                    it('should return all params', () => {
                        expect(subject).to.have.property('members');
                        expect(subject).to.have.property('iterations');
                        expect(subject).to.have.property('workTimes');
                        expect(subject).to.have.property('burnDownChart');
                    });

                    it('should create project stats record', async () => {
                        const projectStats = await db.ProjectStats.findOne({where: {projectId: project.id}});
                        expect(projectStats).to.be.not.nil;
                    });
                });

                describe('#checkCache', () => {
                    let subject, stub;
                    beforeEach(async () => {
                        await ProjectStats.calcAll(project.id);
                        await db.ProjectStats.update({updatedAt: Date.now()}, {where: {projectId: project.id}});
                    });
                    before(() => { stub = sinon.stub(config, 'get'); });
                    after(() => stub.restore());

                    context('with before cache time', () => {
                        beforeEach(async () => {
                            stub.withArgs('stats.cacheTime').returns(30000);
                            subject = await ProjectStats.checkCache(project.id);
                        });

                        it('should return true', () => expect(subject).to.be.ok);
                    });

                    context('with after cache time', () => {
                        beforeEach(async () => {
                            stub.withArgs('stats.cacheTime').returns(-30000);
                            subject = await ProjectStats.checkCache(project.id);
                        });

                        it('should return false', () => expect(subject).to.be.not.ok);
                    });
                });
            });
        });
    });
});
