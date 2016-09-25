'use strict';
const expect = require('chai').expect;
const _ = require('lodash');
const co = require('co');
const helper = require('../helper');
const db = require('../../lib/schemes');
const Project = require('../../lib/models/project');
const Member = require('../../lib/models/member');


describe('models', () => {
    describe('member', () => {
        const usernames = ['owner', 'user1', 'user2', 'user3', 'user4'];
        let project;

        afterEach(() => helper.db.clean());
        beforeEach(() => Project.create('project1', usernames[0]).then(x => { project = x; }));

        it('project should have 1 member', () => expectMemberSize(project.id, 1));

        describe('#add', () => {
            let user;
            beforeEach(() => Member.add(project.id, usernames[1]).then(x => { user = x; }));

            it('project should have 2 members', () => expectMemberSize(project.id, 2));
            it('should be inserted to top', () => expectSorted(project.id, [usernames[1], usernames[0]]));
            it('wip limit of a member should be default value', () =>
                expect(user.member.wipLimit).to.be.equals(project.defaultWipLimit));
        });

        describe('#add x 3', () => {
            let users;
            beforeEach(() => co(function* () {
                users = ['dummy'];
                users.push(yield Member.add(project.id, usernames[1]));
                users.push(yield Member.add(project.id, usernames[2]));
                users.push(yield Member.add(project.id, usernames[3]));
            }));

            it('project should have 4 members', () => expectMemberSize(project.id, 4));
            it('should be inserted to top', () => expectSorted(project.id, _.reverse(usernames.slice(0, 4))));

            describe('#findByUsername', () => {
                let user;
                beforeEach(() => Member.findByUsername(project.id, usernames[2]).then(x => { user = x; }));

                it('should be return a user', () => expect(user).to.have.property('id', users[2].id));
            });

            describe('#findByUserId', () => {
                let user;
                beforeEach(() => Member.findByUserId(project.id, users[2].id).then(x => { user = x; }));

                it('should be return a user', () => expect(user).to.have.property('username', usernames[2]));
            });

            describe('#remove', () => {
                beforeEach(() => Member.remove(project.id, usernames[1]));

                it('project should have 3 members', () => expectMemberSize(project.id, 3));
                it('removed member should be not exists', () => {
                    return db.User.findOne({where: {username: usernames[1]}})
                        .then(user => db.Member.findOne({where: {projectId: project.id, userId: user.id}}))
                        .then(member => expect(member).to.not.exist);
                });
                it('should be reordered', () => expectSorted(project.id, [usernames[3], usernames[2], usernames[0]]));
            });

            describe('#update', () => {
                let user;
                beforeEach(() => Member.update(project.id, usernames[1], {wipLimit: 5}).then(x => { user = x; }));
                it('wip limit of a member should be updated', () => expect(user.member.wipLimit).to.be.equals(5));
            });
        });

        describe('#updateOrder', () => {
            beforeEach(() => co(function* () {
                for (let username of usernames.slice(1)) {
                    yield Member.add(project.id, username);
                }
            }));

            // TODO: n=3
            let n = 5;
            _.times(n, from => {
                _.times(n, to => {
                    if (from === to) return;
                    context(`update position from ${from} to ${to}`, () => {
                        const _usernames = _.reverse(usernames.slice());
                        beforeEach(() => {
                            const target = _usernames[from];
                            const before = _usernames[to];
                            _usernames.splice(from, 1);
                            _usernames.splice(_usernames.indexOf(before), 0, target);
                            return Member.updateOrder(project.id, target, before);
                        });

                        it('should ordered', () => expectSorted(project.id, _usernames));
                    });
                });
                context(`update position from ${from} to last`, () => {
                    const _usernames = _.reverse(usernames.slice());
                    beforeEach(() => {
                        const target = _usernames.splice(from, 1)[0];
                        _usernames.push(target);
                        return Member.updateOrder(project.id, target, null);
                    });

                    it('should ordered', () => expectSorted(project.id, _usernames));
                });
            });
        });
    });
});


function expectMemberSize (projectId, n) {
    return db.Project.findById(projectId, {include: [db.User]}).then(_project => {
        expect(_project.users).to.lengthOf(n);
    });
}

function expectSorted (projectId, order) {
    return Member.getAllSorted(projectId).then(users => {
        expect(users.map(x => x.username)).to.eql(order);

        _.times(users.length, i => {
            expect(users[i]).to.have.deep.property('member.prevMemberId', i ? users[i - 1].member.id : null);
            expect(users[i]).to.have.deep.property('member.nextMemberId', i + 1 < users.length ? users[i + 1].member.id : null);
        });
    });
}
