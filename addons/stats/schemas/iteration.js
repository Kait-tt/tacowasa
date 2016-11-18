'use strict';
module.exports = function (sequelize, DataTypes) {
    const Iteration = sequelize.define('iteration', {
        startTime: {
            allowNull: false,
            type: DataTypes.DATE
        },
        endTime: {
            allowNull: false,
            type: DataTypes.DATE
        }
    }, {
        classMethods: {
            associate: function (models) {
                Iteration.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: true
                    }
                });
            }
        }
    });
    return Iteration;
};
