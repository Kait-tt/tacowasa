'use strict';
const db = require('../schemes');

class Stage {
    static async findById (projectId, id, options = {}) {
        const stage = db.Stage.findById(id, options);
        return stage && stage.toJSON();
    }
}

module.exports = Stage;
