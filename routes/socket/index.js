const socketio = require('socket.io');
const _ = require('lodash');
const co = require('co');
const sessionMiddleware = require('../../lib/modules/sessionMiddleware');
const Project = require('../../lib/models/project');
const SocketUser = require('./user');
const SocketProject = require('./project');

class SocketRouter {
    constructor(server) {
        this.io = socketio.listen(server);
        this.users = {};
        this.projects = {};

        // session
        this.io.use((socket, next) => sessionMiddleware(socket.request, {}, next));

        // auth
        this.io.use((socket, next) => {
            next(new Error(`required login: ${socket.id}`));
        });

        this.io.sockets.on('connection', socket => {
            const user = new SocketUser(socket);
            let projectSocket;

            this.users[socket.id] = user;
            console.log(`new connected: ${socket.id}`);

            socket.on('joinProjectRoom', ({projectId}) => co(function* () {
                projectSocket = yield this.joinProjectRoom(user, projectId);
                yield projectSocket.joinProjectRoom(user);
            }).catch(err => console.error(err)));

            socket.on('leaveProjectRoom', () => co(function* () {
                yield this.leaveProjectRoom(user);
                yield projectSocket.leaveProjectRoom(user);
            }).catch(err => console.error(err)));

            socket.on('disconnect', () => co(function* () {
                if (user.projectId) {
                    yield this.leaveProjectRoom(user);
                    yield projectSocket.leaveProjectRoom(user);
                }
                console.log(`disconnect: ${socket.id}`);
                user.active = false;
                delete this.users[socket.id];
            }).catch(err => console.error(err)));
        });
    }

    joinProjectRoom(user, projectId) {
        return co(function* () {
            const project = yield Project.findById(projectId, {include: []});
            if (!project) throw new Error(`invalid project id: ${projectId}`);

            if (!this.projects[projectId]) {
                this.projects[projectId] = new SocketProject(this.io, projectId);
            }

            const projectSocket = this.projects[projectId];

            projectSocket.joinUser(user);
            user.projectId = projectId;

            return projectSocket;
        });
    }

    leaveProjectRoom(user) {
        return Promise.resolve(() => {
            if (user.projectId) {
                user.socket.leave(user.projectId);
            }
        });
    }
}

module.exports = SocketRouter;
