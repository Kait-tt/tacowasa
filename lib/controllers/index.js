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
}

module.exports = {
    Index: IndexController,
    Auth: require('./auth'),
    User: require('./user'),
    Project: require('./project'),
    Api: require('./api')
};
