const db = require('../../schemas');

class ProblemAbstract {
    constructor ({projectId}) {
        this.projectId = projectId;
        this.causes = this.constructor.CauseClasses.map(CauseClass => {
            return new CauseClass();
        });
    }

    static get title () {
        throw new Error('must be implemented');
    }

    static get goodDescription () {
        throw new Error('must be implemented');
    }

    static get badDescription () {
        throw new Error('must be implemented');
    }

    static get checkDurationSeconds () {
        return 5 * 60; // 5 minutes
    }

    static get CauseClasses () {
        return [];
    }

    async checKProblem () {
        throw new Error('must be implemented');
    }

    async findProjectProblem ({transaction} = {}) {
        return await db.EvaluationProjectProblem.findOne({where: {
            projectId: this.projectId,
            problemName: this.constructor.name
        },
            transaction
        });
    }

    async createProjectProblem ({transaction} = {}) {
        return await db.EvaluationProjectProblem.create({
            projectId: this.projectId,
            problemName: this.constructor.name,
            isOccurred: false
        }, {transaction});
    }

    async findOrCreateProjectProblem ({transaction} = {}) {
        const res = await this.findProjectProblem({transaction});
        if (res) { return res; }
        return await this.createProjectProblem({transaction});
    }

    async updateStatus ({isOccurred}, {transaction} = {}) {
        const projectProblem = await this.findOrCreateProjectProblem({transaction});

        await projectProblem.update({
            isOccurred
        }, {
            transaction
        });
    }

    async needCheckProblem () {
        const projectProblem = await this.findProjectProblem();
        if (!projectProblem) { return true; }
        const expire = Number(new Date(projectProblem.updatedAt)) + this.constructor.checkDurationSeconds * 1000;
        return Date.now() > expire;
    }
}

module.exports = ProblemAbstract;
