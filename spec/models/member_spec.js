'use strict';
const expect = require('chai').expect;
const _ = require('lodash');
const co = require('co');
const helper = require('../helper');
const db = require('../../schemes');
const Project = require('../../models/project');
const Member = require('../../models/member');

afterEach(() => helper.db.clean());

describe('models', () => {
    describe('member', () => {
        const usernames = ['owner', 'user1', 'user2'];
        let project;

        beforeEach(() => Project.create('project1', usernames[0]).then(x => project = x));

        it('project should have 1 member', () => expectMemberSize(project.id, 1));

        describe('#add', () => {
            let user;
            beforeEach(() => Member.add(project.id, usernames[1]).then(x => user = x));

            it('project should have 2 members', () => expectMemberSize(project.id, 2));
            it('should be inserted to top', () => expectSorted(project.id, [usernames[1], usernames[0]]));
            it('wip limit of a member should be default value', () =>
                expect(user.member.wipLimit).to.be.equals(project.defaultWipLimit));
        });

        describe('#add x 2', () => {
            beforeEach(() => co(function* () {
                yield Member.add(project.id, usernames[1]);
                yield Member.add(project.id, usernames[2]);
            }));

            it('project should have 3 members', () => expectMemberSize(project.id, 3));
            it('should be inserted to top', () => expectSorted(project.id, [usernames[2], usernames[1], usernames[0]]));

            describe('#remove', () => {
                beforeEach(() => Member.remove(project.id, usernames[1]));

                it('project should have 2 members', () => expectMemberSize(project.id, 2));
                it('removed member should be not exists', () => {
                    return db.User.findOne({where: {username: usernames[1]}})
                        .then(user => db.Member.findOne({where: {projectId: project.id, userId: user.id}}))
                        .then(member => expect(member).to.not.exist);
                });
                it('should be reordered', () => expectSorted(project.id, [usernames[2], usernames[0]]));
            });

            describe('#update', () => {
                let user;
                beforeEach(() => Member.update(project.id, usernames[1], {wipLimit: 5}).then(x => user = x));
                it('wip limit of a member should be updated', () => expect(user.member.wipLimit).to.be.equals(5));
            });
        });
    });
});


function expectMemberSize(projectId, n) {
    return db.Project.findById(projectId, {include: [db.User]}).then(_project => {
        expect(_project.users).to.lengthOf(n);
    });
}

function expectSorted(projectId, order) {
    Member.getAllSorted(projectId).then(users => {
        order.forEach((username, i) => {
            expect(users[i]).to.have.property('username', username);
        });

        _.times(users.length, i => {
            expect(users[i]).to.have.deep.property('member.prevMemberId', i ? users[i - 1].member.id : null);
            expect(users[i]).to.have.deep.property('member.nextMemberId', i + 1 < users.length ? users[i + 1].member.id : null);
        });
    });
}