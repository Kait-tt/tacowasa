'use strict';
module.exports = function (sequelize, DataTypes) {
    const EvaluationProjectProblems = sequelize.define('evaluationProjectProblems', {
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
                EvaluationProjectProblems.belongsTo(models.Project, {
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
    return EvaluationProjectProblems;
};
