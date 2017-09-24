const ko = require('knockout');
const moment = require('moment');

class Solver {
    constructor (params) {
        this.name = params.name;
        this.title = params.title;
        this.description = params.description;
        this.isSolved = ko.observable(params.isSolved);
        this.relatedProblems = ko.observableArray();
        this.updatedAt = ko.observable(params.updatedAt);
        this.updatedAtMoment = ko.pureComputed(() => moment(this.updatedAt()));
    }
}

module.exports = Solver;
