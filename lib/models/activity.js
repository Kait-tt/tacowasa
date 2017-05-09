'use strict';
const db = require('../schemes');

class Activity {
    static async findActivities (projectId, limit = 200, {transaction} = {}) {
        const activities = await db.Activity.findAll({where: {projectId}, limit, order: [['createdAt', 'desc']], transaction});
        return activities.reverse().map(x => x.toJSON());
    }

    static async add (projectId, sender, content, {transaction} = {}) {
        const activity = await db.Activity.create({projectId, sender, content}, {transaction});
        return activity && activity.toJSON();
    }
}

module.exports = Activity;
