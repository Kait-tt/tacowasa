'use strict';

class IndexController {
    static getIndex (req, res) {
        const mustLogin = req.params.mustLogin === '1';
        const logined = req.isAuthenticated && req.isAuthenticated();
        const username = req.user ? req.user.username : null;

        res.render('index', {
            title: 'Tacowasa',
            displayTitle: 'Tacowasa',
            logined: logined,
            mustLogin: mustLogin,
            username: username
        });
    }

    static notFound (req, res) {
        res.status(404);
        res.render('error', {
            message: 'Not Found',
            error: {}
        });
    }

    static internalServerError (err, req, res, next) {
        res.status(err.status || 500);
        if (err && (!err.status || Math.floor(err.status / 100) === 5)) {
            console.error(err);
        }

        res.render('error', {
            message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
            error: process.env.NODE_ENV === 'production' ? {} : err
        });
    }
}

module.exports = {
    Index: IndexController,
    Auth: require('./auth'),
    User: require('./user'),
    Project: require('./project'),
    Api: require('./api')
};
