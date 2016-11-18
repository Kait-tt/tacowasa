'use strict';
const _ = require('lodash');
const co = require('co');
const db = require('../../schemas');
const MemberWorkTime = require('../../models/member_work_time');
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

                before(co.wrap(function* () {
                    const _project = yield Project.create('project1', 'user1');
                    yield Member.add(_project.id, 'user2');
                    project = yield Project.findById(_project.id);
                    userIds = project.users.map(x => x.id);
                }));
                after(() => helper.db.clean());
                afterEach(co.wrap(function* () {
                    yield db.MemberWorkTime.destroy({where: {}});
                }));

                describe('#create', () => {
                    beforeEach(co.wrap(function* () {
                        yield MemberWorkTime.create(project.id, userIds[0], {
                            startTime: Date.now() - 100000,
                            endTime: Date.now(),
                            promisedMinutes: 100
                        });
                    }));

                    it('should create new member work time', co.wrap(function* () {
                        const workTimes = yield MemberWorkTime.findByProjectIdAndUserId(project.id, userIds[0]);
                        expect(workTimes).to.have.lengthOf(1);
                        expect(workTimes).to.have.deep.property('[0].startTime');
                        expect(workTimes).to.have.deep.property('[0].endTime');
                        expect(workTimes).to.have.deep.property('[0].promisedMinutes', 100);
                        expect(workTimes).to.have.deep.property('[0].actualMinutes', 0);
                    }));
                });

                context('with some member work time', () => {
                    const n = 5;
                    beforeEach(co.wrap(function* () {
                        for (let i = 0; i < n; i++) {
                            const userId = _.sample(userIds);
                            const now = Date.now();
                            const startTimeOffset = _.random(10000, 50000);
                            const endTimeOffset = _.random(0, startTimeOffset - 1);
                            const promisedMinutes = _.random(100, 1000);
                            yield MemberWorkTime.create(project.id, userId, {
                                startTime: now - startTimeOffset,
                                endTime: now - endTimeOffset,
                                promisedMinutes: promisedMinutes
                            });
                        }
                    }));

                    describe('#findByProjectId', () => {
                        let subject;
                        beforeEach(co.wrap(function* () {
                            subject = yield MemberWorkTime.findByProjectId(project.id);
                        }));

                        it('should return all member work time', () => {
                            expect(subject).to.have.lengthOf(2);
                            const all = _.flatten(subject.map(x => x.memberWorkTimes));
                            expect(all).to.have.lengthOf(n);
                        });
                    });
                });
            });
        });
    });
});
