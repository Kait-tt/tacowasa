const fs = require('fs');
const path = require('path');
const sortBy = require('lodash/sortBy');
const db = require('../schemas');

class Evaluator {
    constructor ({projectId}) {
        this.problems = this.constructor.ProblemClasses.map(ProblemClass =>
            new ProblemClass({projectId}));

        this.causes = this.constructor.CauseClasses.map(CauseClass =>
            new CauseClass({projectId}));

        this.solvers = this.constructor.SolverClasses.map(SolverClass =>
            new SolverClass({projectId}));
    }

    static get ProblemClasses () {
        return this._requires('problems');
    }

    static get CauseClasses () {
        return this._requires('causes');
    }

    static get SolverClasses () {
        return this._requires('solvers');
    }

    static findProblem (name) {
        return this.ProblemClasses.find(x => x.name === name);
    }

    static findCause (name) {
        return this.CauseClasses.find(x => x.name === name);
    }

    static findSolver (name) {
        return this.SolverClasses.find(x => x.name === name);
    }

    static async evaluateAllProjects ({force} = {force: false}) { // no transaction
        const projects = await db.Project.findAll({where: {enabled: true}});
        for (let {id} of projects) {
            const evaluator = new this({projectId: id});
            await evaluator.evaluate({force});
        }
    }

    async evaluate ({force} = {force: false}) { // no transaction
        for (let problem of this.problems) {
            if (force || await problem.needCheckProblem()) {
                await problem.checkProblem();
            }
        }
    }

    static _requires (dirname) {
        const dirPath = path.join(__dirname, dirname);
        return fs
            .readdirSync(dirPath)
            .filter(file => file.indexOf('.') !== 0)
            .filter(file => !file.endsWith('_abstract.js'))
            .map(file => require(path.join(dirPath, file)));
    }

    async serialize () {
        return {
            problems: sortBy(await Promise.all(this.problems.map(problem =>
                problem.serialize()
            )), 'name'),
            causes: sortBy(await Promise.all(this.causes.map(cause =>
                cause.serialize()
            )), 'name'),
            solvers: sortBy(await Promise.all(this.solvers.map(async solver =>
                solver.serialize()
            )), 'name')
        };
    }
}

module.exports = Evaluator;
