const ko = require('knockout');

class Solver {
    constructor (params) {
        this.name = params.name;
        this.title = params.title;
        this.description = params.description;
    }
}

module.exports = Solver;
