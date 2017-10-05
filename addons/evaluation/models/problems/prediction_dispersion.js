const ProblemAbstract = require('./problem_abstract');
const ProjectStats = require('../../../stats/models/project_stats');

class PredictionDispersion extends ProblemAbstract {
    static get CauseClasses () {
        return [
            require('../causes/poor_estimation')
        ];
    }

    static get title () {
        return '予測の分散';
    }

    static get goodDescription () {
        return '予測の分散は許容範囲内です。';
    }

    static get badDescription () {
        return '予測の分散が大きすぎます。';
    }

    async _checkProblem () {
        const members = await ProjectStats.findEachMembers(this.projectId);
        const isOccurred = members
            .filter(member => member.mean)
            .some(member => !this.constructor.innerAllowableError(member));

        await this.updateStatus({isOccurred});
        return isOccurred;
    }

    static innerAllowableError ({low, mean, high}) {
        // minute -> hour
        ({low, mean, high} = {low: low / 60, mean: mean / 60, high: high / 60});

        const error = high - low;
        const maxError = 0.30 + mean * 0.2;
        return error <= maxError;
    }
}

module.exports = PredictionDispersion;
