'use strict';
const db = require('../schemes');

class Activity {
    static add (projectId, sender, content) {
        return db.Activity.create({projectId, sender, content})
            .then(x => x ? x.toJSON() : null);
    }

    static findActivities (projectId, limit = 200) {
        return db.Activity.findAll({where: {projectId}, limit, order: [['createdAt', 'asc']]})
            .then(xs => xs ? xs.map(x => x.toJSON()) : xs);
    }
}

module.exports = Activity;
