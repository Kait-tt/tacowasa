const ko = require('knockout');
const moment = require('moment');

class Problem {
    constructor (params) {
        this.name = params.name;
        this.title = params.title;
        this.detail = ko.observable(params.detail);
        this.badDescription = params.badDescription;
        this.badDescription = params.badDescription;
        this.goodDescription = params.goodDescription;
        this.causes = ko.observableArray(params.causes);
        this.isOccurred = ko.observable(params.isOccurred);
        this.updatedAt = ko.observable(params.updatedAt);
        this.updatedAtMoment = ko.pureComputed(() => moment(this.updatedAt()));
        this.logs = ko.observableArray(params.logs);
        this.solveMemos = ko.pureComputed(() => this.logs().filter(x => x.memo));
    }
}

module.exports = Problem;
