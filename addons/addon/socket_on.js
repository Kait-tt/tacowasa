'use strict';

// register addon socket events
class AddonSocketOn {
    static register ({socketProject, user}) {
        this.socketEventKeys.forEach(key => {
            user.socket.on(key, req => this[key](socketProject, user, req)
                .catch(err => {
                    user.socket.emit('operationError', {error: err, message: err.message});
                    console.error(err);
                }));
        });

        return {socketProject, user};
    }

    static get socketEventKeys () {
        return [];
    }
}

module.exports = AddonSocketOn;
