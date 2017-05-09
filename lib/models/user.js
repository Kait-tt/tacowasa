'use strict';
const db = require('../schemes');
const _ = require('lodash');
const GitHub = require('github');
const config = require('config');

class User {
    static async findOrCreate (username, options = {}) {
        return db.transaction({transaction: options.transaction}, async transaction => {
            let user = await db.User.findOne(_.defaults({where: {username}, transaction}, options));
            if (user) { return user.toJSON(); }
            const iconUri = await User.fetchIconUri(username);
            user = await db.User.create({username, iconUri}, _.defaults({transaction}, options));
            return user.toJSON();
        });
    }

    static async fetchIconUri (username) {
        const api = new GitHub();
        const token = config.get('github.userToken');
        if (token) {
            api.authenticate({
                type: 'token',
                token
            });
        }

        const user = await api.users.getForUser({user: username});
        return user.avatar_url;
    }

    static async findAll (options = {}) {
        const users = db.User.findAll(options);
        return users.map(x => x.toJSON());
    }
}

module.exports = User;
