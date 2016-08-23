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

    }

    static detach(projectId, labelId, taskId) {

    }

    static findAll(projectId, options={}) {
        return db.Label.findAll(_.defaults(options, {where: {projectId}}))
            .then(labels => labels.map(x => x.toJSON()));
    }
}

module.exports = Label;