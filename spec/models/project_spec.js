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
            let project;

            beforeEach(() => {
                return db.User.create({username: 'user1'})
                    .then(user => Project.create('project1', user))
                    .then(x => project = x);
            });

            it('should create a new project', () => db.Project.findAll().then(xs => expect(xs).to.lengthOf(1)));

            describe('#findAll', () => {
                let res;

                beforeEach(() => Project.findAll().then(x => res = x));

                it('should return a array having a project', () => expect(res).to.lengthOf(1));
            });

            describe('#findOne', () => {
                let res;

                beforeEach(() => Project.findOne().then(x => res = x));

                it('should return a project', () => expect(res).to.be.an('object'));
            });

            describe('#findById', () => {
                let res;

                beforeEach(() => Project.findById(project.id).then(x => res = x));

                it('should return a project', () => expect(res).to.be.an('object'));
            });
        });
    });
});