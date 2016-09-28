'use strict';
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const db = require('../schemes');
const _ = require('lodash');
const co = require('co');

class User {
    static findOrCreate (username, options = {}) {
        return db.User.findOrCreate(_.defaults({where: {username}}, options)).then(x => x[0].toJSON());
    }

    static findAll (options = {}) {
        return db.User.findAll(options).then(xs => xs.map(x => x.toJSON()));
    }

    static avatarFilePath (username) {
        const dir = User.avatarDirPath;

        return co(function* () {
            const files = yield fs.readdirAsync(dir);
            for (let file of files) {
                if (!_.startsWith(file, `${username}.`)) { continue; }
                const stat = yield fs.statAsync(dir + file);
                if (stat.isFile()) {
                    return {dir, file};
                }
            }
            null;
        });
    }

    static get avatarDirPath () {
        return `${__dirname}/../..//public/images/avatar/`;
    }
}

module.exports = User;
