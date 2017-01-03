'use strict';
const db = require('../lib/schemes');
const User = require('../lib/models/user');

db.coTransaction({}, function* (transaction) {
    const users = yield User.findAll({transaction});
    for (let user of users) {
        const iconUri = yield User.fetchIconUri(user.username);
        console.log(`set ${user.username} icon to ${iconUri}`);
        yield db.User.update({iconUri}, {where: {id: user.id}, transaction});
    }
    console.log('successful.');
}).catch(e => console.error(e));
