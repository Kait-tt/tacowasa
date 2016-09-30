'use strict';
const User = require('../models/user');

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

    static getUserAvatar (req, res, next) {
        const {username} = req.params;

        User.avatarFilePath(username)
            .then(path => {
                if (path) {
                    res.sendFile(path.file, {root: path.dir});
                } else {
                    next();
                }
            })
            .catch(err => next(err));
    }
}

module.exports = UserController;
