const socketio = require('socket.io');
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

            this.users[socket.id] = user;
            console.log(`new connected: ${socket.id} , ${user.username}`);

            socket.on('joinProjectRoom', ({projectId}) => (async () => {
                await this.joinProjectRoom(user, projectId);
            })().catch(err => console.error(err)));

            socket.on('leaveProjectRoom', () => (async () => {
                await this.leaveProjectRoom(user);
            })().catch(err => console.error(err)));

            socket.on('disconnect', () => (async () => {
                if (user.projectId) {
                    await this.leaveProjectRoom(user);
                }
                console.log(`disconnect: ${socket.id} , ${user.username}`);
                user.active = false;
                delete this.users[socket.id];
            })().catch(err => console.error(err)));
        });
    }

    async joinProjectRoom (user, projectId) {
        const project = await Project.findById(projectId, {include: []});
        if (!project) throw new Error(`invalid project id: ${projectId}`);

        if (!this.projects[projectId]) {
            console.log(`create room: ${projectId}`);
            this.projects[projectId] = new SocketProject(this.io, projectId);
        }

        const projectSocket = this.projects[projectId];

        user.projectId = projectId;
        user.socket.join(projectId);
        await projectSocket.joinProjectRoom(user);

        return projectSocket;
    }

    async leaveProjectRoom (user) {
        if (user.projectId && this.projects[user.projectId]) {
            await this.projects[user.projectId].leaveProjectRoom(user);
            user.socket.leave(user.projectId);
        }
    }
}

module.exports = SocketRouter;
