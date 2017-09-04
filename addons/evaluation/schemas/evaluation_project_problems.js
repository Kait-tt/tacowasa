'use strict';
module.exports = function (sequelize, DataTypes) {
    const EvaluationProjectProblem = sequelize.define('evaluationProjectProblem', {
        problemName: {
            allowNull: false,
            type: DataTypes.STRING
        },
        isOccurred: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            default: false
        }
    }, {
        classMethods: {
            associate: function (models) {
                EvaluationProjectProblem.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: false
                    }
                });
            },
            indexes: [
                {
                    unique: true,
                    fields: ['projectId', 'problemName']
                }
            ]
        }
    });
    return EvaluationProjectProblem;
};
