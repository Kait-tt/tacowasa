'use strict';
module.exports = function (sequelize, DataTypes) {
    const EvaluationProjectProblemLog = sequelize.define('evaluationProjectProblemLog', {
        evaluationProjectProblemId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        isOccurred: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            default: false
        },
        memo: {
            allowNull: true,
            type: DataTypes.STRING,
        }
    }, {
        classMethods: {
            associate: function (models) {
                EvaluationProjectProblemLog.belongsTo(models.EvaluationProjectProblem, {
                    foreignKey: {
                        allowNull: false
                    }
                });
            }
        }
    });
    return EvaluationProjectProblemLog;
};
