'use strict';
const db = require('../schemes');
const _ = require('lodash');
const GitHub = require('github');
const config = require('config');

class User {
    static findOrCreate (username, options = {}) {
        return db.coTransaction({transaction: options.transaction}, function* (transaction) {
            let user = yield db.User.findOne(_.defaults({where: {username}, transaction}, options));
            if (user) { return user.toJSON(); }
            const iconUri = yield User.fetchIconUri(username);
            user = yield db.User.create({username, iconUri}, _.defaults({transaction}, options));
            return user.toJSON();
        });
    }

    static fetchIconUri (username) {
        const api = new GitHub();
        const token = config.get('github.userToken');
        if (token) {
            api.authenticate({
                type: 'token',
                token
            });
        }
        return api.users.getForUser({user: username}).then(x => x.avatar_url).catch(e => {
            console.error(e);
            return null;
        });
    }

    static findAll (options = {}) {
        return db.User.findAll(options).then(xs => xs.map(x => x.toJSON()));
    }
}

module.exports = User;
