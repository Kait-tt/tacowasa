'use strict';
const db = require('../schemes');
const _ = require('lodash');
const Task = require('./task');

class Label {
    static async findAll (projectId, options = {}) {
        const labels = await db.Label.findAll(_.defaults(options, {where: {projectId}}));
        return labels.map(x => x.toJSON());
    }

    static async create (projectId, {name, color}, options = {}) {
        const label = await db.Label.create({projectId, name, color}, options);
        return label.toJSON();
    }

    static async destroy (projectId, labelId, options = {}) {
        return db.Label.destroy(_.defaults({where: {projectId, id: labelId}}, options));
    }

    static async destroyAll (projectId, options = {}) {
        return db.Label.destroy(_.defaults({where: {projectId}}, options));
    }

    static async attach (projectId, labelId, taskId, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const task = await db.Task.findOne({where: {projectId, id: taskId}, transaction});
            if (!task) {
                throw new Error(`task(${taskId}) is not found in ${projectId}.`);
            }

            const label = await db.Label.findOne({where: {projectId, id: labelId}, transaction});
            if (!label) {
                throw new Error(`label(${labelId}) is not found in ${projectId}.`);
            }

            await task.addLabel(label, {transaction});

            return {
                task: await Task.findOne({where: {projectId, id: taskId}, transaction}),
                label: label.toJSON()
            };
        });
    }

    static async detach (projectId, labelId, taskId, {transaction} = {}) {
        return db.transaction({transaction}, async transaction => {
            const task = await db.Task.findOne({where: {projectId, id: taskId}, transaction});
            if (!task) {
                throw new Error(`task(${taskId}) is not found in ${projectId}.`);
            }

            const label = await db.Label.findOne({where: {projectId, id: labelId}, transaction});
            if (!label) {
                throw new Error(`label(${labelId}) is not found in ${projectId}.`);
            }

            await db.TaskLabel.destroy({where: {taskId, labelId}, transaction});

            return {
                task: await Task.findOne({where: {projectId, id: taskId}, transaction}),
                label: label.toJSON()
            };
        });
    }
}

module.exports = Label;
