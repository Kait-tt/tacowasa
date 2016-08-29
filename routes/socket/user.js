class SocketUser {
    constructor(socket) {
        this.socket = socket;
        this.id = this.socket.id;
        this.info = socket.request.session
            && socket.request.session.passport
            && socket.request.session.passport.user;
        this.username = info && info.username;
        this.active = true;
        this.projectId = null;
    }
}

module.exports = SocketUser;