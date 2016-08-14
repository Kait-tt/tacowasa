'use strict';
var expect = require('chai').expect;
var helper = require('../helper');
var db = require('../../schemes');

afterEach(() => helper.db.clean());

describe('schemes', () => {
    describe('githubRepository', () => {
        describe('#create', () => {
            let project, repo;

            beforeEach(() => {
                return db.User.create({username: 'user1'})
                    .then(user => db.Project.create({name: 'project1', createUserId: user.id }).then(x => project = x))
                    .then(project => db.GitHubRepository.create({
                        projectId: project.id, username: 'hoge', reponame: 'piyo'
                    }).then(x => repo = x));
            });

            it('should create a new github repository', () => {
                return db.GitHubRepository.findAll().then(_repos => {
                    expect(_repos).to.have.lengthOf(1);
                    expect(_repos[0]).to.have.property('username', 'hoge');
                    expect(_repos[0]).to.have.property('reponame', 'piyo');
                    expect(_repos[0]).to.have.property('sync', true);
                });
            });

            it('project should have a github repository', () => {
                return db.Project.findById(project.id, {include: [{model: db.GitHubRepository}]}).then(_project => {
                    expect(_project).to.have.property('githubRepository');
                    expect(_project).to.have.deep.property('githubRepository.username', 'hoge');
                });
            });
        });
    });
});