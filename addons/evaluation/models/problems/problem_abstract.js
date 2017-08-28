class ProblemAbstract {
    constructor () {
        this.causes = this.constructor.CauseClasses.map(CauseClass => {
            return new CauseClass();
        });

        this.projectProblems = [];
    }

    static get checkDurationSeconds () {
        return 5 * 60; // 5 minutes
    }

    static get CauseClasses () {
        return [];
    }

    static checkProblem () {
        throw new Error('must be implemented');
    }
}

module.exports = ProblemAbstract;
