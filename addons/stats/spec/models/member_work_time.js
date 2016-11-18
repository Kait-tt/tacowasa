'use strict';
const _ = require('lodash');
const co = require('co');
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

                before(co.wrap(function* () {
                    const _project = yield Project.create('project1', 'user1');
                    yield Member.add(_project.id, 'user2');
                    project = yield Project.findById(_project.id);
                    userIds = project.users.map(x => x.id);

                    const now = Date.now();
                    const it1 = yield Iteration.create(project.id, {startTime: now - 50000, endTime: now - 40000});
                    const it2 = yield Iteration.create(project.id, {startTime: now - 40000, endTime: now - 30000});
                    iterationIds = [it1.id, it2.id];
                }));
                after(() => helper.db.clean());
                afterEach(co.wrap(function* () {
                    yield db.MemberWorkTime.destroy({where: {}});
                }));

                describe('#create', () => {
                    beforeEach(co.wrap(function* () {
                        yield MemberWorkTime.create(project.id, userIds[0], iterationIds[0], {
                            promisedMinutes: 100
                        });
                    }));

                    it('should create new member work time', co.wrap(function* () {
                        const workTimes = yield MemberWorkTime.findByProjectIdAndUserId(project.id, userIds[0]);
                        expect(workTimes).to.have.lengthOf(1);
                        expect(workTimes).to.have.deep.property('[0].iterationId', iterationIds[0]);
                        expect(workTimes).to.have.deep.property('[0].promisedMinutes', 100);
                        expect(workTimes).to.have.deep.property('[0].actualMinutes', 0);
                    }));
                });

                context('with some member work time', () => {
                    beforeEach(co.wrap(function* () {
                        for (let userId of userIds) {
                            for (let iterationId of iterationIds) {
                                const promisedMinutes = _.random(100, 1000);
                                yield MemberWorkTime.create(project.id, userId, iterationId, {
                                    actualMinutes: promisedMinutes / 2,
                                    promisedMinutes: promisedMinutes
                                });
                            }
                        }
                    }));

                    describe('#findByProjectId', () => {
                        let subject;
                        beforeEach(co.wrap(function* () {
                            subject = yield MemberWorkTime.findByProjectId(project.id);
                        }));

                        it('should return all member work time', () => {
                            expect(subject).to.have.lengthOf(userIds.length * iterationIds.length);
                        });
                    });
                });
            });
        });
    });
});
