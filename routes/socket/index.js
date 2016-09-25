const socketio = require('socket.io');
const co = require('co');
const sessionMiddleware = require('../../lib/modules/sessionMiddleware');
const Project = require('../../lib/models/project');
const SocketUser = require('./user');
const SocketProject = require('./project');

let _instance = null;

class SocketRouter {
    static get instance () {
        return _instance;
    }

    constructor (server) {
        if (_instance) { return _instance; }
        _instance = this;

        this.io = socketio.listen(server);
        this.users = {};
        this.projects = {};

        // session
        this.io.use((socket, next) => sessionMiddleware(socket.request, {}, next));

        // auth
        this.io.use((socket, next) => {
            if (!socket.request.session || !socket.request.session.passport || !socket.request.session.passport.user) {
                next(new Error(`required login: ${socket.id}`));
            } else {
                next();
            }
        });

        this.io.sockets.on('connection', socket => {
            const user = new SocketUser(socket);
            let projectSocket;

            this.users[socket.id] = user;
            console.log(`new connected: ${socket.id}`);

            const that = this;
            socket.on('joinProjectRoom', ({projectId}) => co(function* () {
                projectSocket = yield that.joinProjectRoom(user, projectId);
                yield projectSocket.joinProjectRoom(user);
            }).catch(err => console.error(err)));

            socket.on('leaveProjectRoom', () => co(function* () {
                yield that.leaveProjectRoom(user);
                yield projectSocket.leaveProjectRoom(user);
            }).catch(err => console.error(err)));

            socket.on('disconnect', () => co(function* () {
                if (user.projectId) {
                    yield that.leaveProjectRoom(user);
                    yield projectSocket.leaveProjectRoom(user);
                }
                console.log(`disconnect: ${socket.id}`);
                user.active = false;
                delete that.users[socket.id];
            }).catch(err => console.error(err)));
        });
    }

    joinProjectRoom (user, projectId) {
        const that = this;
        return co(function* () {
            const project = yield Project.findById(projectId, {include: []});
            if (!project) throw new Error(`invalid project id: ${projectId}`);

            if (!that.projects[projectId]) {
                console.log(`create room: ${projectId}`);
                that.projects[projectId] = new SocketProject(that.io, projectId);
            }

            const projectSocket = that.projects[projectId];

            projectSocket.joinRoom(user);
            user.projectId = projectId;
            user.socket.join(projectId);

            return projectSocket;
        });
    }

    leaveProjectRoom (user) {
        return Promise.resolve(() => {
            if (user.projectId) {
                user.socket.leave(user.projectId);
            }
        });
    }
}

module.exports = SocketRouter;
