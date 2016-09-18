'use strict';
const db = require('../schemes');
const _ = require('lodash');
const co = require('co');

class Activity {
    static add(projectId, sender, content) {
        return db.Activity.create({projectId, sender, content})
            .then(x => x ? x.toJSON() : null);
    }

    static
}

module.exports = Activity;