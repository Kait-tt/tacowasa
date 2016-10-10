'use strict';
const IssueHook = require('./issueHook');

class GitHubAddonHook {
    static getHook (eventName, action) {
        const hooks = GitHubAddonHook.hooks;
        return (hooks[eventName] && hooks[eventName][action]) || null;
    }

    static get hooks () {
        return {
            issues: IssueHook.actions
        };
    }
}

module.exports = GitHubAddonHook;

