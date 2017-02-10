'use strict';
const _ = require('lodash');
const db = require('../schemas');

const INVALID_DATE = 'Invalid Date';

class Iteration {
    static create (projectId, {startTime, endTime}, {transaction} = {}) {
        return db.coTransaction({transaction}, function* (transaction) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            if (!Iteration._isValidDate(start)) {
                throw new Error(`invalid start time : ${startTime}`);
            }
            if (!Iteration._isValidDate(end)) {
                throw new Error(`invalid end time : ${endTime}`);
            }
            if (start >= end) {
                throw new Error(`invalid term : ${startTime} - ${endTime}`);
            }

            const existsIterations = yield db.Iteration.findAll({where: {projectId}, transaction});
            const isDuplicated = existsIterations.some(it => {
                const s = new Date(it.startTime);
                const e = new Date(it.endTime);
                return Iteration._isDuplicated(start, end, s, e);
            });

            if (isDuplicated) {
                throw new Error('iteration terms are duplicated');
            }

            const iteration = yield db.Iteration.create({projectId, startTime, endTime}, {transaction});
            return iteration.toJSON();
        });
    }

    static update (projectId, iterationId, {startTime, endTime}, {transaction} = {}) {
        return db.coTransaction({transaction}, function* (transaction) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            if (!Iteration._isValidDate(start)) {
                throw new Error(`invalid start time : ${startTime}`);
            }
            if (!Iteration._isValidDate(end)) {
                throw new Error(`invalid end time : ${endTime}`);
            }
            if (start >= end) {
                throw new Error(`invalid term : ${startTime} - ${endTime}`);
            }

            const iterations = yield db.Iteration.findAll({where: {projectId}, transaction});
            const otherIterations = iterations.filter(x => x.id !== iterationId);
            const isDuplicated = otherIterations.some(it => {
                const s = new Date(it.startTime);
                const e = new Date(it.endTime);
                return Iteration._isDuplicated(start, end, s, e);
            });

            if (isDuplicated) {
                throw new Error('iteration terms are duplicated');
            }

            yield db.Iteration.update({startTime, endTime}, {where: {id: iterationId, projectId}, transaction});

            const iteration = yield db.Iteration.findOne({where: {id: iterationId, projectId}, transaction});
            return iteration ? iteration.toJSON() : null;
        });
    }

    static remove (projectId, iterationId, {transaction} = {}) {
        return db.Iteration.destroy({where: {projectId, id: iterationId}, transaction});
    }

    static findByProjectId (projectId, {transaction} = {}) {
        return db.Iteration.findAll({where: {projectId}, transaction})
            .then(xs => _.chain(xs).map(x => x.toJSON()).sortBy('startTime').value());
    }

    static _isValidDate (value) {
        return value.toString && value.toString() !== INVALID_DATE;
    }

    static _isDuplicated (s1, e1, s2, e2) {
        if (s1 > s2) { return Iteration._isDuplicated(s2, e2, s1, e1); }
        return e1 > s2;
    }
}

module.exports = Iteration;
