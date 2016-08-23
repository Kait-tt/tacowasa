'use strict';
const expect = require('chai').expect;
const _ = require('lodash');
const helper = require('../helper');
const db = require('../../lib/schemes');
const Project = require('../../lib/models/project');

afterEach(() => helper.db.clean());

describe('models', () => {
    describe('project', () => {
        describe('#create', () => {
            const username = 'user1';
            let project;

            beforeEach(() => {
                return Project.create('project1', username)
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