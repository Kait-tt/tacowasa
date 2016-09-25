'use strict';
const expect = require('chai').expect;
const helper = require('../../../../spec/helper');
const db = require('../../schemas');

afterEach(() => helper.db.clean());

describe('schemes', () => {
    describe('githubRepository', () => {
        describe('#create', () => {
            beforeEach(() => {
                return db.User.create({username: 'user1'})
                    .then(user => db.Project.create({name: 'project1', createUserId: user.id}))
                    .then(project => db.GitHubRepository.create({
                        projectId: project.id, username: 'hoge', reponame: 'piyo'
                    }));
            });

            it('should create a new github repository', () => {
                return db.GitHubRepository.findAll().then(_repos => {
                    expect(_repos).to.have.lengthOf(1);
                    expect(_repos[0]).to.have.property('username', 'hoge');
                    expect(_repos[0]).to.have.property('reponame', 'piyo');
                    expect(_repos[0]).to.have.property('sync', true);
                });
            });
        });
    });
});
