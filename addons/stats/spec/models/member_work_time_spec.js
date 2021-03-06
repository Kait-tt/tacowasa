'use strict';
const _ = require('lodash');
const db = require('../../schemas');
const MemberWorkTime = require('../../models/member_work_time');
const Iteration = require('../../models/iteration');
const Project = require('../../../../lib/models/project');
const Member = require('../../../../lib/models/member');
const helper = require('../../../../spec/helper');
const expect = helper.expect;

describe('addons', () => {
    describe('stats', () => {
        describe('models', () => {
            describe('MemberWorkTime', () => {
                let project;
                let userIds;
                let iterationIds;

                before(async () => {
                    const _project = await Project.create('project1', 'user1');
                    await Member.add(_project.id, 'user2');
                    project = await Project.findById(_project.id);
                    userIds = project.users.map(x => x.id);

                    const now = Date.now();
                    const it1 = await Iteration.create(project.id, {startTime: now - 50000, endTime: now - 40000});
                    const it2 = await Iteration.create(project.id, {startTime: now - 40000, endTime: now - 30000});
                    iterationIds = [it1.id, it2.id];
                });
                after(() => helper.db.clean());
                afterEach(() => db.MemberWorkTime.destroy({where: {}}));

                describe('#create', () => {
                    beforeEach(() => MemberWorkTime.create(project.id, userIds[0], iterationIds[0], {promisedMinutes: 100}));

                    it('should create new member work time', async () => {
                        const workTimes = await MemberWorkTime.findByProjectIdAndUserId(project.id, userIds[0]);
                        expect(workTimes).to.have.lengthOf(1);
                        expect(workTimes).to.have.deep.property('[0].iterationId', iterationIds[0]);
                        expect(workTimes).to.have.deep.property('[0].promisedMinutes', 100);
                        expect(workTimes).to.have.deep.property('[0].actualMinutes', 0);
                    });
                });

                context('with some member work time', () => {
                    beforeEach(async () => {
                        for (let userId of userIds) {
                            for (let iterationId of iterationIds) {
                                const promisedMinutes = _.random(100, 1000);
                                await MemberWorkTime.create(project.id, userId, iterationId, {
                                    actualMinutes: promisedMinutes / 2,
                                    promisedMinutes: promisedMinutes
                                });
                            }
                        }
                    });

                    describe('#findByProjectId', () => {
                        let subject;
                        beforeEach(async () => {
                            subject = await MemberWorkTime.findByProjectId(project.id);
                        });

                        it('should return all member work time', () => {
                            expect(subject).to.have.lengthOf(userIds.length * iterationIds.length);
                        });
                    });
                });
            });

            describe('_calcOneIterationWorkTime', () => {
                let subject;
                beforeEach(() => {
                    const now = Date.now();
                    const works = [
                        // not in iteration
                        {startTime: now - 24, endTime: now - 14},
                        // in 2
                        {startTime: now - 13, endTime: now - 10},
                        // in 5
                        {startTime: now - 9, endTime: now - 4},
                        // in 2
                        {startTime: now - 2, endTime: now + 5}
                    ];

                    // 12
                    const start = now - 12;
                    const end = now;

                    subject = MemberWorkTime._calcOneIterationWorkTime(works, start, end);
                });

                it('should return work time in the iteration', () => expect(subject).to.be.eq(9));
            });
        });
    });
});
