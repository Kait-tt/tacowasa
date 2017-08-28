const ko = require('knockout');

class Problem {
    constructor (params) {
        this.name = params.name;
        this.title = params.title;
        this.badDescription = params.badDescription;
        this.goodDescription = params.goodDescription;
        this.causes = ko.observableArray(params.causes);
        this.isOccurred = ko.observable(true); // TODO
    }
}

module.exports = Problem;
