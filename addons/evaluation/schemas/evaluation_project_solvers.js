'use strict';
module.exports = function (sequelize, DataTypes) {
    const EvaluationProjectSolver = sequelize.define('evaluationProjectSolver', {
        solverName: {
            allowNull: false,
            type: DataTypes.STRING
        },
        isSolved: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            default: false
        }
    }, {
        classMethods: {
            associate: function (models) {
                EvaluationProjectSolver.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: false
                    }
                });
            },
            indexes: [
                {
                    unique: true,
                    fields: ['projectId', 'solverName']
                }
            ]
        }
    });
    return EvaluationProjectSolver;
};
