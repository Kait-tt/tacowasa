'use strict';
module.exports = function (sequelize, DataTypes) {
    const TaskLabel = sequelize.define('taskLabel', {
    }, {
        classMethods: {
            associate: function (models) {
                TaskLabel.belongsTo(models.Task, {
                    foreignKey: {
                        allowNull: false
                    }
                });
                TaskLabel.belongsTo(models.Label, {
                    foreignKey: {
                        allowNull: false
                    }
                });
            }
        }
    });
    return TaskLabel;
};
