'use strict';
const expect = require('chai').expect;
const _ = require('lodash');
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

        projectShouldNMembers(1);

        describe('#add', () => {
            let user;
            beforeEach(() => Member.add(project.id, usernames[1]).then(x => user = x));

            projectShouldNMembers(2);
            it('wip limit of a member should be default value', () => expect(user.member.wipLimit).to.be.equals(project.defaultWipLimit));
        });

        describe('#add x 2', () => {
            beforeEach(() => Promise.all(usernames.map(x => Member.add(project.id, x))));
            projectShouldNMembers(3);

            describe('#remove', () => {
                beforeEach(() => Member.remove(project.id, usernames[1]));
                projectShouldNMembers(2);
                it('should member has not removed member', () => {
                    return db.User.findOne({where: {username: usernames[1]}})
                        .then(user => db.Member.findOne({where: {projectId: project.id, userId: user.id}}))
                        .then(member => expect(member).to.not.exist);
                });
            });

            describe('#update', () => {
                let user;
                beforeEach(() => Member.update(project.id, usernames[1], {wipLimit: 5}).then(x => user = x));
                it('wip limit of a member should be updated', () => expect(user.member.wipLimit).to.be.equals(5));
            });
        });

        function projectShouldNMembers(n) {
            it(`project should ${n} members`, () => {
                db.Project.findById(project.id, {include: [db.User]}).then(_project => {
                    expect(_project.users).to.lengthOf(n);
                });
            });
        }
    });
});