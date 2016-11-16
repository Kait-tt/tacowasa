'use strict';
const db = require('../schemas');
const Throughput = require('./throughput');

class ProjectStats {
    static calcAll (projectId, {transaction} = {}) {
        return db.coTransaction({transaction}, function* () {
            // create or update project stats, and lock
            yield db.ProjectStats.upsert({
                projectId,
                throughput: 0,
                updatedAt: Date()
            }, {where: {projectId}, transaction});

            const throughputs = yield Throughput.calcAll(projectId, {transaction});
            return {throughputs};
        });
    }

    static lock (projectId, {transaction} = {}) {
        return db.ProjectStats.update({updatedAt: Date()}, {where: {projectId}, transaction});
    }
}

module.exports = ProjectStats;
