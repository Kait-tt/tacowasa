'use strict';

class AddonAPI {
    // called when raised several api
    // params are different
    static getProjects({res, req, projects})    { return Promise.resolve({res, req, projects}); }
    static getProject({res, req, project})     { return Promise.resolve({res, req, project}); }
    static archiveProject({res, req, project}) { return Promise.resolve({res, req, project}); }
    static createProject({res, req, project})  { return Promise.resolve({res, req, project}); }
}

module.exports = AddonAPI;
