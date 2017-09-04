const db = require('../../schemas');

class ProblemAbstract {
    constructor ({projectId}) {
        this.projectId = projectId;
        this.causes = this.constructor.CauseClasses.map(CauseClass => {
            return new CauseClass({projectId});
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

    async checkProblem () {
        const isOccurred = await this._checkProblem();
        if (isOccurred) {
            await this.updateAllSolverChildren({isSolved: false});
        }
    }

    async _checkProblem () {
        throw new Error('must be implemented');
    }

    async updateAllSolverChildren ({isSolved}, {transaction} = {}) {
        for (let cause of this.causes) {
            for (let solver of cause.solvers) {
                await solver.updateStatus({isSolved}, {transaction});
            }
        }
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
        // 既に問題が発生していたら更新しない
        // 問題の解決確認はユーザーが行う
        if (projectProblem.isOccurred) { return false; }
        const expire = Number(new Date(projectProblem.updatedAt)) + this.constructor.checkDurationSeconds * 1000;
        return Date.now() > expire;
    }
}

module.exports = ProblemAbstract;
