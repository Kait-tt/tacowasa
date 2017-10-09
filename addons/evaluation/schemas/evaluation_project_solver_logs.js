'use strict';
module.exports = function (sequelize, DataTypes) {
    const EvaluationProjectSolverLog = sequelize.define('evaluationProjectSolverLog', {
        evaluationProjectSolverId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        isSolved: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            default: false
        },
        memo: {
            allowNull: true,
            type: DataTypes.TEXT
        }
    }, {
        classMethods: {
            associate: function (models) {
                EvaluationProjectSolverLog.belongsTo(models.EvaluationProjectSolver, {
                    foreignKey: {
                        allowNull: false
                    }
                });
            }
        }
    });
    return EvaluationProjectSolverLog;
};
