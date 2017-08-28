const ko = require('knockout');

class Problem {
    constructor (params) {
        this.name = params.name;
        this.title = params.title;
        this.badDescription = params.badDescription;
        this.goodDescription = params.goodDescription;
        this.causes = params.causes;
        this.isOccurred = ko.observable(params.name.startsWith('Task')); // TODO
    }
}

module.exports = Problem;
