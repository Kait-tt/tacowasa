const CauseAbstract = require('./cause_abstract');

class UnknownCuase extends CauseAbstract {
    static get SolverClasses () {
        return [
            require('../solvers/retrospective')
        ];
    }
}


module.exports = UnknownCuase;
