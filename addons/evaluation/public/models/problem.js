const ko = require('knockout');

class Problem {
    constructor (params) {
        this.name = params.name;
        this.title = params.title;
        this.badDescription = params.badDescription;
        this.goodDescription = params.goodDescription;
        this.causes = params.causes;
        this.isOccured = ko.observable(false); // TODO

        this.description = ko.computed(() => {
            return this.isOccured() ? this.badDescription : this.goodDescription;
        });
    }
}

module.exports = Problem;
