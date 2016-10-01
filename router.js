'use strict';
const express = require('express');
const Controller = require('./lib/controllers/');
const addon = require('./addons');

class Router extends express.Router {
    constructor (passport, options) {
        super(options);

        this.get('/', Controller.Index.getIndex);

        this.get('/auth/github', passport.authenticate('github'));
        this.get('/auth/logout', Controller.Auth.getLogout);
        this.get('/auth/github/callback', passport.authenticate('github', {failureRedirect: '/?mustlogin=1'}),
            Controller.Auth.getGitHubCallback);

        this.all('/users/*', Controller.Auth.ensureAuthenticated);
        this.get('/users/me', Controller.User.getMe);
        this.get('/users/:username/avatar', Controller.User.getUserAvatar);

        this.get('/users/:username/projects/:projectId/:projectName',
            Controller.Project.getProject);

        this.all('/api/*', Controller.Auth.ensureAuthenticatedApi);
        this.get('/api/projects', Controller.Api.getProjects);
        this.post('/api/projects', Controller.Api.createProject);
        this.get('/api/projects/:projectId', Controller.Api.getProject);
        this.delete('/api/projects/:projectId', Controller.Api.deleteProject);

        addon.callAddons('Router', 'setRouter', {parentRouter: this}, {sync: true});

        this.all('/api/*', Controller.Api.notFound);
        this.all('*', Controller.Index.notFound);
        this.use(Controller.Index.internalServerError);
    }
}

module.exports = Router;
