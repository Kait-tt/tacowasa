class CauseAbstract {
    constructor () {
        this.solvers = this.constructor.SolverClasses.map(SolverClass => {
            return new SolverClass();
        });
    }

    static get title () {
        throw new Error('must be implemented');
    }

    static get SolverClasses () {
        return [];
    }
}

module.exports = CauseAbstract;
