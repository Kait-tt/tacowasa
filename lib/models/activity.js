'use strict';
const _ = require('lodash');
const db = require('../schemes');

class Activity {
    static add (projectId, sender, content, {transaction} = {}) {
        return db.Activity.create({projectId, sender, content}, {transaction})
            .then(x => x ? x.toJSON() : null);
    }

    static findActivities (projectId, limit = 200, {transaction} = {}) {
        return db.Activity.findAll({where: {projectId}, limit, order: [['createdAt', 'desc']], transaction})
            .then(xs => _.reverse(xs))
            .then(xs => xs ? xs.map(x => x.toJSON()) : xs);
    }
}

module.exports = Activity;
