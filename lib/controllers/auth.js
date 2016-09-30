'use strict';
const User = require('../models/user');

class AuthController {
    static ensureAuthenticated (req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/?mustlogin=1');
    }

    static ensureAuthenticatedApi (req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.status(401).json({message: 'require authorization'});
    }

    static notEnsureAuthenticated (req, res, next) {
        if (!req.isAuthenticated()) { return next(); }
        res.redirect('/');
    }

    static getLogout (req, res) {
        req.logout();
        res.redirect('/');
    }

    static getGitHubCallback (req, res, next) {
        User.findOrCreate(req.user.username)
            .then(() => res.redirect('/users/me'))
            .catch(err => next(new Error(err)));
    }
}

module.exports = AuthController;
