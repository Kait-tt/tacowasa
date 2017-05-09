'use strict';
const db = require('../lib/schemes');
const User = require('../lib/models/user');

db.transaction(async transaction => {
    const users = await User.findAll({transaction});
    for (let user of users) {
        const iconUri = await User.fetchIconUri(user.username);
        console.log(`set ${user.username} icon to ${iconUri}`);
        await db.User.update({iconUri}, {where: {id: user.id}, transaction});
    }
    console.log('successful.');
}).catch(e => console.error(e));
