'use strict';
const db = require('../schemes');
const _ = require('lodash');

class User {
    static findOrCreate (username, options = {}) {
        return db.User.findOrCreate(_.defaults({where: {username}}, options)).then(x => x[0].toJSON());
    }

    static findAll (options = {}) {
        return db.User.findAll(options).then(xs => xs.map(x => x.toJSON()));
    }

    static findById (projectId, id, options = {}) {
        return db.Stage.findById(id, options).then(x => x && x.toJSON());
    }
}

module.exports = User;
