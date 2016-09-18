'use strict';

class AddonAPI {
    constructor() {

    }

    // called when raised several api
    // params are {}
    static getProjects(params) { return Promise.resolve(params); }
    static getProject(params) { return Promise.resolve(params); }
    static deleteProject(params) { return Promise.resolve(params); }
    static createProject(params) { return Promise.resolve(params); }
}

module.exports = AddonAPI;
