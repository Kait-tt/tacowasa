'use strict';
const expect = require('chai').expect;
const _ = require('lodash');
const co = require('co');
const helper = require('../helper');
const Project = require('../../lib/models/project');
const Task = require('../../lib/models/task');
const Label = require('../../lib/models/label');


describe('models', () => {
    describe('task', () => {
        let labelsParams = [
            {name: 'testlabel1', color: 'fe9245'},
            {name: 'testlabel2', color: '831732'},
            {name: 'testlabel3', color: '9823ea'}
        ];
        let project;
        let initLabelSize;

        afterEach(() => helper.db.clean());
        beforeEach(() => co(function* () {
            project = yield Project.create('project1', 'owner');
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
            });
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

            describe('#attach', () => {
                let task;
                let attachLabel;
                beforeEach(() => co(function* () {
                    task = yield Task.create(project.id, {title: 'task1', body: 'body1'});
                    attachLabel = labels[0];
                    yield Label.attach(project.id, attachLabel.id, task.id);
                    task = yield Task.findById(task.id);
                }));

                it('the task should have a label', () => {
                    expect(task.labels).to.lengthOf(1);
                    expect(task).to.have.deep.property('labels[0].name', attachLabel.name);
                    expect(task).to.have.deep.property('labels[0].color', attachLabel.color);
                });
            });

            describe('#attach x 3', () => {
                let task;
                let attachLabels;
                beforeEach(() => co(function* () {
                    task = yield Task.create(project.id, {title: 'task1', body: 'body1'});
                    attachLabels = labels.slice(0, 3);
                    for (let label of attachLabels) {
                        yield Label.attach(project.id, label.id, task.id);
                    }
                    task = yield Task.findById(task.id);
                }));

                it('the task should have three labels', () => {
                    expect(task.labels).to.lengthOf(3);
                    _.forEach(attachLabels, (label, i) => {
                        expect(task.labels[i]).to.have.property('name', label.name);
                        expect(task.labels[i]).to.have.property('color', label.color);
                    });
                });

                describe('#detach', () => {
                    let detachLabel;

                    beforeEach(() => co(function* () {
                        detachLabel = attachLabels[1];
                        yield Label.detach(project.id, detachLabel.id, task.id);
                        task = yield Task.findById(task.id);
                    }));

                    it('the task should have two labels', () => {
                        expect(task.labels).to.lengthOf(2);
                    });
                    it('the task should not have detached label', () => {
                        expect(_.map(task.labels, 'id')).to.not.includes(detachLabel.id);
                    });
                });
            });
        });
    });
});
