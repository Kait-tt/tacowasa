const db = require('../../schemas');
const max = require('lodash/max');

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
        return 60 * 60; // 1 hour
    }

    static get CauseClasses () {
        return [];
    }

    async checkProblem () {
        const isOccurred = await this._checkProblem();
        if (isOccurred) {
            await this.updateAllSolverChildren({isSolved: false});
        }
        return isOccurred;
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

    async updateStatus ({isOccurred, memo, detail}, {transaction} = {}) {
        const projectProblem = await this.findOrCreateProjectProblem({transaction});
        const beforeIsOccurred = projectProblem.isOccurred;

        const detailStr = JSON.stringify(detail);

        await db.EvaluationProjectProblem.update({
            isOccurred,
            detail: detailStr
        }, {
            where: {
                id: projectProblem.id
            },
            transaction
        });

        if (beforeIsOccurred !== isOccurred) {
            await db.EvaluationProjectProblemLog.create({
                evaluationProjectProblemId: projectProblem.id,
                isOccurred,
                memo: memo || detailStr || null
            });
        }
    }

    async needCheckProblem () {
        const projectProblem = await this.findProjectProblem();
        if (!projectProblem) { return true; }
        // ~既に問題が発生していたら更新しない~
        // ~問題の解決確認はユーザーが行う~
        // detailの更新のためにdurationごとに更新をかける。もうちょいいい感じにしたい。
        // if (projectProblem.isOccurred) { return false; }
        const expire = Number(new Date(projectProblem.updatedAt)) + this.constructor.checkDurationSeconds * 1000;
        return Date.now() > expire;
    }

    async serialize () {
        const projectProblem = await this.findOrCreateProjectProblem();
        const logs = await this.findLogs(projectProblem.id);

        return {
            name: this.constructor.name,
            title: this.constructor.title,
            detail: JSON.parse(projectProblem.detail),
            goodDescription: this.constructor.goodDescription,
            badDescription: this.constructor.badDescription,
            causes: this.causes.map(cause => cause.constructor.name),
            isOccurred: projectProblem.isOccurred,
            updatedAt: projectProblem.updatedAt,
            logs: logs.map(x => x.toJSON())
        };
    }

    async findLogs (projectProblemId) {
        return db.EvaluationProjectProblemLog.findAll({
            where: {evaluationProjectProblemId: projectProblemId},
            fields: ['isOccurred', 'memo', 'createdAt']
        });
    }

    async getLastSolvedTime (projectProblemId) {
        const logs = db.EvaluationProjectProblemLog.findAll({
            where: {
                evaluationProjectProblemId: projectProblemId,
                isOccurred: false
            },
            fields: ['isOccurred', 'createdAt']
        });
        return max(logs.map(x => x.createdAt));
    }
}

module.exports = ProblemAbstract;
