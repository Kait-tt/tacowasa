'use strict';
module.exports = function (sequelize, DataTypes) {
    const EvaluationProjectProblems = sequelize.define('evaluationProjectProblems', {
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
            }
        }
    });
    return EvaluationProjectProblems;
};
