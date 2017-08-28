'use strict';
const AddonSocketOn = require('../addon/socket_on');
const Evaluator = require('./models/evaluator');

class EvaluationSocketOn extends AddonSocketOn {
    static get socketEventKeys () {
        return ['fetchEvaluation'];
    }

    static async fetchEvaluation (socketProject, user) {
        await socketProject.logging(user.username, 'fetchEvaluation');
        const evaluator = new Evaluator({});
        user.socket.emit('evaluation', evaluator.serialize());
    }
}

module.exports = EvaluationSocketOn;
