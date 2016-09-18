'use strict';
const express = require('express');

class AddonRouter {
    static setRouter({app}) {
        const router = express.Router();
        this.initRouter(router);
        app.use(this.root, router);
        return {app};
    }

    static initRouter(router) {
        //router.get('/path', (req, res) => { ... })
    }

    static get root() {
        return '/';
    }
}

module.exports = AddonRouter;
