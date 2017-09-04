const ko = require('knockout');

class Solver {
    constructor (params) {
        this.name = params.name;
        this.title = params.title;
        this.description = params.description;
        this.isSolved = ko.observable(params.isSolved);
        this.relatedProblems = ko.observableArray();
    }
}

module.exports = Solver;
