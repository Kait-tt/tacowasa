'use strict';
const AddonRouter = require('../addon/router');
const Controller = require('./controller');

class GitHubAddonRouter extends AddonRouter {
    constructor (options) {
        super(options);

        this.post('/api/projects', Controller.importProject);
        this.post('/hook/:projectId', Controller.postHook);
    }

    static get root () {
        return '/github';
    }
}

module.exports = GitHubAddonRouter;
