class CauseAbstract {
    constructor ({projectId}) {
        this.projectId = projectId;
        this.solvers = this.constructor.SolverClasses.map(SolverClass => {
            return new SolverClass({projectId});
        });
    }

    static get title () {
        throw new Error('must be implemented');
    }

    static get SolverClasses () {
        return [];
    }

    async serialize () {
        return {
            name: this.constructor.name,
            title: this.constructor.title,
            solvers: this.solvers.map(solver => solver.constructor.name)
        };
    }
}

module.exports = CauseAbstract;
