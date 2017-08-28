const ko = require('knockout');

class Cause {
    constructor (params) {
        this.name = params.name;
        this.title = params.title;
        this.solvers = ko.observableArray(params.solvers);
        this.isSolved = ko.computed(() => this.solvers().some(solver => solver.isSolved()));
    }
}

module.exports = Cause;
