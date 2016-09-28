'use strict';
const express = require('express');
const router = express.Router();
const User = require('../lib/models/user');

// My Page
router.get('/me', function (req, res) {
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
});

router.get('/:username/avatar', function (req, res, next) {
    const {username} = req.params;

    User.avatarFilePath(username)
        .then(path => {
            if (path) {
                res.sendFile(path.file, {root: path.dir});
            } else {
                res.status(404).end(`${username}'s avatar was not found.`);
            }
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

module.exports = router;
