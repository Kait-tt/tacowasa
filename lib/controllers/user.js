'use strict';

class UserController {
    static getMe (req, res) {
        const mustLogin = req.params.mustLogin === '1';
        const logined = req.isAuthenticated && req.isAuthenticated();
        const username = req.user ? req.user.username : null;

        res.render('user', {
            title: username + ' | Tacowasa',
            displayTitle: username,
            user: req.user,
            logined: logined,
            mustLogin: mustLogin,
            username: username
        });
    }
}

module.exports = UserController;
