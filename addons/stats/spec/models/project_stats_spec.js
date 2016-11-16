'use strict';
const _ = require('lodash');
const co = require('co');
const sinon = require('sinon');
const Throughput = require('../../models/throughput');
const ProjectStats = require('../../models/project_stats');
const db = require('../../schemas');
const Project = require('../../../../lib/models/project');
const helper = require('../../../../spec/helper');
const expect = helper.expect;

describe('addons', () => {
    describe('stats', () => {
        describe('models', () => {
            describe('ProjectStats', () => {
                let project;
                let stub;

                before(co.wrap(function* () {
                    project = yield Project.create('project1', 'user1');
                    stub = sinon.stub(Throughput, 'calcAll');
                    stub.returns(Promise.resolve(true));
                }));
                after(() => {
                    stub.restore();
                    return helper.db.clean();
                });

                describe('calcAll', () => {
                    let subject;

                    beforeEach(co.wrap(function* () {
                        subject = yield ProjectStats.calcAll(project.id);
                    }));

                    it('should return throughputs', () => {
                        expect(subject).to.have.property('throughputs', true);
                    });

                    it('should create project stats record', co.wrap(function* () {
                        const projectStats = yield db.ProjectStats.findOne({where: {projectId: project.id}});
                        expect(projectStats).to.be.not.nil;
                    }));
                });
            });
        });
    });
});
