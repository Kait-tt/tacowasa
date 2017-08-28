class SolverAbstract {
    constructor () {
        this.projectSolver = [];
    }

    static get checkDurationSeconds () {
        return 5 * 60; // 5 minutes
    }

    static checkSolved () {
        throw new Error('must be implemented');
    }
}

module.exports = SolverAbstract;
