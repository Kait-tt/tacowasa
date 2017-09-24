const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const config = require('config');

module.exports = session({
    key: config.get('session.name'),
    secret: config.get('session.secret'),
    store: new MySQLStore({
        host: 'localhost',
        port: 3306,
        user: config.get('db.username'),
        password: config.get('db.password'),
        database: config.get('db.database'),
        retries: 10
    }),
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
});
