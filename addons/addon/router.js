'use strict';
const express = require('express');

class AddonRouter {
    static setRouter({app}) {
        app.use(this.root, this.createRouter());
        return {app};
    }

    static createRouter() {
        const router = express.Router();
        //router.get('/path', (req, res) => { ... })
        return router
    }

    static get root() {
        return '/';
    }
}

module.exports = AddonRouter;
