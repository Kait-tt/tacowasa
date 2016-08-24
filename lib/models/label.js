'use strict';
const db = require('../schemes');
const _ = require('lodash');
const co = require('co');

class Label {
    static create(projectId, {name, color}) {
        return db.Label.create({projectId, name, color});
    }

    static destroy(projectId, labelId) {
        return db.Label.destroy({where: {projectId, id: labelId}});
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

            return {task, label};
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

            return {task, label};
        });
    }

    static findAll(projectId, options={}) {
        return db.Label.findAll(_.defaults(options, {where: {projectId}}))
            .then(labels => labels.map(x => x.toJSON()));
    }
}

module.exports = Label;