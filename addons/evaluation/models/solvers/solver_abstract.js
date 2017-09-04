const db = require('../../schemas');

class SolverAbstract {
    constructor ({projectId}) {
        this.projectId = projectId;
    }

    static get title () {
        throw new Error('must be implemented');
    }

    static get description () {
        throw new Error('must be implemented');
    }

    static get checkDurationSeconds () {
        return 5 * 60; // 5 minutes
    }

    static checkSolved () {
        throw new Error('must be implemented');
    }

    async findProjectSolver ({transaction} = {}) {
        return await db.EvaluationProjectSolver.findOne({where: {
            projectId: this.projectId,
            solverName: this.constructor.name
        },
            transaction
        });
    }

    async createProjectSolver ({transaction} = {}) {
        return await db.EvaluationProjectSolver.create({
            projectId: this.projectId,
            solverName: this.constructor.name,
            isSolved: true
        }, {transaction});
    }

    async findOrCreateProjectSolver ({transaction} = {}) {
        const res = await this.findProjectSolver({transaction});
        if (res) { return res; }
        return await this.createProjectSolver({transaction});
    }

    async updateStatus ({isSolved}, {transaction} = {}) {
        const projectSolver = await this.findOrCreateProjectSolver({transaction});

        await db.EvaluationProjectSolver.update({
            isSolved
        }, {
            where: {
                id: projectSolver.id
            },
            transaction
        });
    }

    async serialize () {
        const projectSolver = await this.findOrCreateProjectSolver();
        return {
            name: this.constructor.name,
            title: this.constructor.title,
            description: this.constructor.description,
            isSolved: projectSolver.isSolved,
            updatedAt: projectSolver.updatedAt
        };
    }
}

module.exports = SolverAbstract;
