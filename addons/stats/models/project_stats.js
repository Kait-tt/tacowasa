'use strict';
const db = require('../schemas');

class ProjectStats {
    static calcThroughput (projectId) {

    }

    static lock (projectId, {transaction} = {}) {
        return db.ProjectStats.update({updatedAt: Date()}, {where: {projectId}, transaction});
    }
}

module.exports = ProjectStats;
