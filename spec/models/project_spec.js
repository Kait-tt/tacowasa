'use strict';
const expect = require('chai').expect;
const _ = require('lodash');
const helper = require('../helper');
const db = require('../../schemes');
const Project = require('../../models/project');

afterEach(() => helper.db.clean());

describe('models', () => {
    describe('project', () => {
        describe('#create', () => {
            context('with default options', () => {
                let project;

                beforeEach(() => {
                    return db.User.create({username: 'user1'})
                        .then(user => Project.create('project1', user))
                        .then(x => project = x);
                });

                it('should create a new project', () => {
                    // console.log(JSON.stringify(project, null, '  '));
                    expect(project).to.exist;
                });
            });
        });
    });
});