'use strict';
const expect = require('chai').expect;
const _ = require('lodash');
const co = require('co');
const helper = require('../helper');
const db = require('../../lib/schemes');
const Project = require('../../lib/models/project');
const Task = require('../../lib/models/task');
const Label = require('../../lib/models/label');

afterEach(() => helper.db.clean());

describe('models', () => {
    describe('task', () => {
        let labelsParams = [
            {name: 'testlabel1', color: 'fe9245'},
            {name: 'testlabel2', color: '831732'},
            {name: 'testlabel3', color: '9823ea'},
        ];
        let project;
        let initLabelSize;

        beforeEach(() => co(function* () {
            let {id} = yield Project.create('project1', 'owner');
            project = yield Project.findById(id);
            initLabelSize = project.labels.length;
        }));

        describe('#add', () => {
            let label, labels;
            beforeEach(() => co(function* () {
                label = yield Label.create(project.id, labelsParams[0]);
                labels = yield Label.findAll(project.id);
            }));

            it('should create a new label', () => {
                expect(label).to.have.property('name', labelsParams[0].name);
                expect(label).to.have.property('color', labelsParams[0].color);
                expect(labels).to.lengthOf(initLabelSize + 1);
            })
        });

        describe('#add x 3', () => {
            let labels;
            beforeEach(() => co(function* () {
                for (let params of labelsParams) {
                    yield Label.create(project.id, params);
                }
                labels = yield Label.findAll(project.id);
            }));

            it('should create three new labels', () => {
                expect(labels).to.lengthOf(initLabelSize + 3);
            });

            describe('#destroy', () => {
                let targetLabel;
                beforeEach(() => co(function* () {
                    targetLabel = _.find(labels, labelsParams[1]);
                    yield Label.destroy(project.id, targetLabel.id);
                    labels = yield Label.findAll(project.id);
                }));

                it('destroyed label should be not found', () => {
                    expect(_.map(labels, 'id')).to.not.includes(targetLabel.id);
                });
            });
        });
    });
});
