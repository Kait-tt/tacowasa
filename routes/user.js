const express = require('express');
const router = express.Router();
const fs = require('fs');
const _ = require('lodash');
const co = require('co');
const Promise = require('bluebird');
const path = Promise.promisifyAll(require('path'));

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

router.get('/:username/avatar', function (req, res) {
    const dir = `${__dirname}/../public/images/avatar/`;
    const {username} = req.params;

    co(function* () {
        const files = yield fs.readdir(dir);
        for (let file of files) {
            if (!_.startsWith(file, `${username}.`)) { continue; }
            const stat = yield fs.stat(dir + file);
            if (stat.isFile()) {
                return file;
            }
        }
        throw new Error(`${username}'s avatar was not found.`);
    })
        .then(file => res.sendFile(file, {root: dir}))
        .catch(e => {
            res.status(404).end(e.message);
        });
});

module.exports = router;
