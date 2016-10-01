'use strict';
const express = require('express');

class AddonRouter extends express.Router {
    static setRouter ({parentRouter, routerOptions}) {
        parentRouter.use(this.root, new this(routerOptions));
        return {parentRouter};
    }

    static get root () {
        return '/';
    }
}

module.exports = AddonRouter;
