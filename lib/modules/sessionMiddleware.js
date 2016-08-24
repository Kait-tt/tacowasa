var session = require('express-session');
var mysqlStore = require('connect-mysql')(session);
var config = require('config');

module.exports = session({
    name: config.get('session.name'),
    secret: config.get('session.secret'),
    store: new mysqlStore({
        secret: config.get('session.secret'),
        config: {
            user: config.get('db.username'),
            password: config.get('db.password'),
            database: config.get('db.database')
        }
    }),
    resave: true,
    saveUninitialized: false
});