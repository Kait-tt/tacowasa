'use strict';
const db = require('../schemes');

class Stage {
    static findById (projectId, id, options = {}) {
        return db.Stage.findById(id, options).then(x => x && x.toJSON());
    }
}

module.exports = Stage;
