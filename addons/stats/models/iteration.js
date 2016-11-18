'use strict';
const _ = require('lodash');
const db = require('../schemas');

const INVALID_DATE = 'Invalid Date';

class Iteration {
    static create (projectId, {startTime, endTime}, {transaction} = {}) {
        return db.coTransaction({transaction}, function* () {
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

    static findByProjectId (projectId, {transaction} = {}) {
        return db.Iteration.findAll({where: {projectId}, transaction})
            .then(xs => xs.map(x => x.toJSON()));
    }

    static _isValidDate (value) {
        return value.toString && value.toString() !== INVALID_DATE;
    }

    static _isDuplicated (s1, e1, s2, e2) {
        if (s1 > s2) { return Iteration._isDuplicated(s2, e2, s1, e1); }
        return e1 >= s2;
    }
}

module.exports = Iteration;
