'use strict';

class AddonSocketOn {
    constructor() {

    }

    // called just after raised several project on events
    // params are {projectId, user, req, socketProject}
    static joinRoom()                { return Promise.resolve(); }
    static leaveRoom()               { return Promise.resolve(); }
    static addUser()                 { return Promise.resolve(); }
    static removeUser()              { return Promise.resolve(); }
    static updateUser()              { return Promise.resolve(); }
    static updateUserOrder()         { return Promise.resolve(); }
    static createTask()              { return Promise.resolve(); }
    static archiveTask()             { return Promise.resolve(); }
    static updateTaskStatus()        { return Promise.resolve(); }
    static updateTaskContent()       { return Promise.resolve(); }
    static updateTaskWorkingState()  { return Promise.resolve(); }
    static updateTaskWorkHistory()   { return Promise.resolve(); }
    static updateTaskOrder()         { return Promise.resolve(); }
    static attachLabel()             { return Promise.resolve(); }
    static detachLabel()             { return Promise.resolve(); }
}

module.exports = AddonSocketOn;