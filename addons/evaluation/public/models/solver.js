const ko = require('knockout');

class Solver {
    constructor (params) {
        this.name = params.name;
        this.title = params.title;
        this.description = params.description;
        this.isSolved = ko.observable(Math.random() < 0.5); // TODO
        this.relatedProblems = ko.observableArray();
    }
}

module.exports = Solver;
