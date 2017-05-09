'use strict';
const db = require('../../schemas');
const Iteration = require('../../models/iteration');
const Project = require('../../../../lib/models/project');
const helper = require('../../../../spec/helper');
const expect = helper.expect;

describe('addons', () => {
    describe('stats', () => {
        describe('models', () => {
            describe('Iteration', () => {
                let project;

                before(async () => {
                    const _project = await Project.create('project1', 'user1');
                    project = await Project.findById(_project.id);
                });
                after(() => helper.db.clean());
                afterEach(() => db.Iteration.destroy({where: {}}));

                describe('#_isValidDate', () => {
                    let date;
                    const expected = () => expect(Iteration._isValidDate(date));

                    context('with valid date', () => {
                        before(() => { date = Date.now(); });
                        it('should return false', () => expected().to.be.ok);
                    });

                    context('with invalid date', () => {
                        before(() => { date = new Date('hogehoge'); });
                        it('should return false', () => expected().to.be.not.ok);
                    });
                });

                describe('#_isDuplicated', () => {
                    let s1, e1, s2, e2, now;
                    const expected = () => expect(Iteration._isDuplicated(s1, e1, s2, e2));
                    const setTerms = (_s1, _e1, _s2, _e2) => {
                        ([s1, e1, s2, e2] = [_s1, _e1, _s2, _e2]);
                    };

                    before(() => { now = Date.now(); });

                    context('with s1 < e1 = s2 < e2', () => {
                        before(() => setTerms(now - 100, now - 50, now - 50, now));
                        it('should return false', () => expected().to.be.not.ok);
                    });

                    context('with s2 < e2 = s1 < e1', () => {
                        before(() => setTerms(now - 50, now, now - 100, now - 50));
                        it('should return false', () => expected().to.be.not.ok);
                    });

                    context('with s1 < s2 < e2 < e1', () => {
                        before(() => setTerms(now - 100, now, now - 70, now - 30));
                        it('should return true', () => expected().to.be.ok);
                    });

                    context('with s1 < s2 < e1 < e2', () => {
                        before(() => setTerms(now - 100, now - 30, now - 70, now));
                        it('should return true', () => expected().to.be.ok);
                    });
                });

                describe('#create', () => {
                    beforeEach(() => Iteration.create(project.id, {
                        startTime: Date.now() - 10000,
                        endTime: Date.now()
                    }));

                    it('should create new iteration', async () => {
                        const iterations = await Iteration.findByProjectId(project.id);
                        expect(iterations).to.have.lengthOf(1);
                        expect(iterations).to.have.deep.property('[0].startTime');
                        expect(iterations).to.have.deep.property('[0].endTime');
                    });

                    context('and create', () => {
                        beforeEach(() => Iteration.create(project.id, {
                            startTime: Date.now(),
                            endTime: Date.now() + 10000
                        }));

                        it('should create new iteration', async () => {
                            const iterations = await Iteration.findByProjectId(project.id);
                            expect(iterations).to.have.lengthOf(2);
                        });
                    });
                });
            });
        });
    });
});
