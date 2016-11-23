'use strict';
module.exports = function (sequelize, DataTypes) {
    const TaskStats = sequelize.define('taskStats', {
        isStagnation: {
            allowNull: false,
            defaultValue: false,
            type: DataTypes.BOOLEAN
        }
    }, {
        classMethods: {
            associate: function (models) {
                TaskStats.belongsTo(models.Task, {
                    foreignKey: {
                        allowNull: true
                    }
                });
            },
            indexes: [
                {
                    unique: true,
                    fields: ['taskId']
                }
            ]
        }
    });
    return TaskStats;
};
