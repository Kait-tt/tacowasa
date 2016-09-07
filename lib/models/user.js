'use strict';
const db = require('../schemes');
const _ = require('lodash');
const co = require('co');

class User {
    // TODO: 手動
    static findOrCreate(username, options={}) {
        return db.User.findOrCreate(_.defaults({where: {username}}, options)).then(x => x[0].toJSON());
    }

    static findAll(options={}) {
        return db.User.findAll(options).then(xs => xs.map(x => x.toJSON()));
    }
}

module.exports = User;