var express = require('express');
var User = require('../lib/models/user');

module.exports = (passport) => {
    const router = express.Router();

    router.ensureAuthenticated = (req, res, next) => {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/?mustlogin=1');
    };

    router.notEnsureAuthenticated = (req, res, next) => {
        if (!req.isAuthenticated()) { return next(); }
        res.redirect('/');
    };

    router.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    });

    router.get('/github', passport.authenticate('github'));

    router.get('/github/callback', passport.authenticate('github', {failureRedirect: '/?mustlogin=1'}),
        (req, res, next) => {
            User.findOrCreate(req.user.username)
                .then(() => res.redirect('/users/me'))
                .catch(err => next(new Error(err)));
        });

    return router;
};
