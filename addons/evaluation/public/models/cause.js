const ko = require('knockout');

class Cause {
    constructor (params) {
        this.name = params.name;
        this.title = params.title;
    }
}

module.exports = Cause;
