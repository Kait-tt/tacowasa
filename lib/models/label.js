'use strict';
const db = require('../schemes');
const _ = require('lodash');
const co = require('co');

class Label {
    static addLabel(projectId, {name, color}) {
        return db.Label.create({projectId, name, color});
    }

    static removeLabel(projectId, labelId) {

    }

    static attachLabel(projectId, labelId, taskId) {

    }

    static detachLabel(projectId, labelId, taskId) {

    }

    static findAll(projectId, options={}) {
        return db.Label.findAll(_.defaults(options, {where: {projectId}}))
            .then(labels => labels.map(x => x.toJSON()));
    }
}

module.exports = Label;