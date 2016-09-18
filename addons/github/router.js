'use strict';
const express = require('express');
const AddonRouter = require('../addon/router');

class GitHubRouter extends AddonRouter {
    static initRouter(router) {
        router.get('/test', (req, res) => {
            res.end('hgoehoge');
        });
    }

    static get root() {
        return '/github'
    }
}

module.exports = GitHubRouter;
