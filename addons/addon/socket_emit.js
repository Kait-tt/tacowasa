'use strict';

class AddonSocketEmit {
    // called just before raised several project emit events
    // params are {projectId, user, params, socketProject}
    static joinRoom(params)                { return Promise.resolve(params); }
    static leaveRoom(params)               { return Promise.resolve(params); }
    static addUser(params)                 { return Promise.resolve(params); }
    static removeUser(params)              { return Promise.resolve(params); }
    static updateUser(params)              { return Promise.resolve(params); }
    static updateUserOrder(params)         { return Promise.resolve(params); }
    static createTask(params)              { return Promise.resolve(params); }
    static archiveTask(params)             { return Promise.resolve(params); }
    static updateTaskStatus(params)        { return Promise.resolve(params); }
    static updateTaskContent(params)       { return Promise.resolve(params); }
    static updateTaskWorkingState(params)  { return Promise.resolve(params); }
    static updateTaskWorkHistory(params)   { return Promise.resolve(params); }
    static updateTaskOrder(params)         { return Promise.resolve(params); }
    static attachLabel(params)             { return Promise.resolve(params); }
    static detachLabel(params)             { return Promise.resolve(params); }
}

module.exports = AddonSocketEmit;