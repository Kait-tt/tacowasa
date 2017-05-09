'use strict';
const expect = require('chai').expect;
const _ = require('lodash');
const helper = require('../helper');
const db = require('../../lib/schemes');
const Project = require('../../lib/models/project');
const Member = require('../../lib/models/member');


describe('models', () => {
    describe('member', () => {
        const usernames = ['owner', 'user1', 'user2', 'user3', 'user4'];
        let project;

        after(() => helper.db.clean());
        before(async () => {
            project = await Project.create('project1', usernames[0], {
                include: [{model: db.User, as: 'users'}]
            });
        });
        afterEach(async () => {
            await db.Member.destroy({where: {}});
            await Member.add(project.id, usernames[0]);
        });

        it('project should have 1 member', () => expectMemberSize(project.id, 1));

        describe('#add', () => {
            let user;
            beforeEach(async () => {
                user = await Member.add(project.id, usernames[1]);
            });

            it('project should have 2 members', () => expectMemberSize(project.id, 2));
            it('should be inserted to top', () => expectSorted(project.id, [usernames[1], usernames[0]]));
            it('wip limit of a member should be default value', () =>
                expect(user.member.wipLimit).to.be.equals(project.defaultWipLimit));
        });

        describe('#add x 3', () => {
            let users;
            beforeEach(async () => {
                users = ['dummy'];
                users.push(await Member.add(project.id, usernames[1]));
                users.push(await Member.add(project.id, usernames[2]));
                users.push(await Member.add(project.id, usernames[3]));
            });

            it('project should have 4 members', () => expectMemberSize(project.id, 4));
            it('should be inserted to top', () => expectSorted(project.id, _.reverse(usernames.slice(0, 4))));

            describe('#findByUsername', () => {
                let user;
                beforeEach(async () => {
                    user = await Member.findByUsername(project.id, usernames[2]);
                });

                it('should be return a user', () => expect(user).to.have.property('id', users[2].id));
            });

            describe('#findByUserId', () => {
                let user;
                beforeEach(async () => {
                    user = await Member.findByUserId(project.id, users[2].id);
                });

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
                beforeEach(async () => {
                    user = await Member.update(project.id, usernames[1], {wipLimit: 5});
                });

                it('wip limit of a member should be updated', () => expect(user.member.wipLimit).to.be.equals(5));
            });
        });

        describe('#updateOrder', () => {
            beforeEach(async () => {
                for (let username of usernames.slice(1)) {
                    await Member.add(project.id, username);
                }
            });

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


async function expectMemberSize (projectId, n) {
    const project = await db.Project.findById(projectId, {include: [db.User]});
    expect(project.users).to.lengthOf(n);
}

async function expectSorted (projectId, order) {
    const users = await Member.getAllSorted(projectId);

    expect(users.map(x => x.username)).to.eql(order);

    _.times(users.length, i => {
        expect(users[i]).to.have.deep.property('member.prevMemberId', i ? users[i - 1].member.id : null);
        expect(users[i]).to.have.deep.property('member.nextMemberId', i + 1 < users.length ? users[i + 1].member.id : null);
    });
}
