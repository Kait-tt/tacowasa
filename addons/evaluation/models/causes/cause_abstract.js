class CauseAbstract {
    constructor () {
        this.solvers = this.constructor.SolverClasses.map(SolverClass => {
            return new SolverClass();
        });
    }

    static get SolverClasses () {
        return [];
    }
}

module.exports = CauseAbstract;
