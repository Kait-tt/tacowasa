'use strict';
const db = require('../schemes');
const _ = require('lodash');
const co = require('co');
const Task = require('./task');

class Label {
    static create(projectId, {name, color}, options={}) {
        return db.Label.create({projectId, name, color}, options);
    }

    static destroy(projectId, labelId) {
        return db.Label.destroy({where: {projectId, id: labelId}});
    }

    static destroyAll(projectId, options={}) {
        return db.Label.destroy(_.defaults({where: {projectId}}, options));
    }

    static attach(projectId, labelId, taskId) {
        return co(function* () {
            const task = yield db.Task.findOne({where: {projectId, id: taskId}});
            if (!task) {
                throw new Error(`task(${taskId}) is not found in ${projectId}.`);
            }

            const label = yield db.Label.findOne({where: {projectId, id: labelId}});
            if (!label) {
                throw new Error(`label(${labelId}) is not found in ${projectId}.`);
            }

            yield task.addLabel(label);

            return {
                task: yield Task.findOne({where: {projectId, id: taskId}}),
                label
            };
        });
    }

    static detach(projectId, labelId, taskId) {
        return co(function* () {
            const task = yield db.Task.findOne({where: {projectId, id: taskId}});
            if (!task) {
                throw new Error(`task(${taskId}) is not found in ${projectId}.`);
            }

            const label = yield db.Label.findOne({where: {projectId, id: labelId}});
            if (!label) {
                throw new Error(`label(${labelId}) is not found in ${projectId}.`);
            }

            yield db.TaskLabel.destroy({where: {taskId, labelId}});

            return {
                task: yield Task.findOne({where: {projectId, id: taskId}}),
                label
            };
        });
    }

    static findAll(projectId, options={}) {
        return db.Label.findAll(_.defaults(options, {where: {projectId}}))
            .then(labels => labels.map(x => x.toJSON()));
    }
}

module.exports = Label;