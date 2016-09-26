'use strict';
module.exports = function (sequelize, DataTypes) {
    const TaskStatusLog = sequelize.define('taskStatusLog', {
    }, {
        classMethods: {
            associate: models => {
                TaskStatusLog.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: false
                    }
                });
                TaskStatusLog.belongsTo(models.Task, {
                    foreignKey: {
                        allowNull: false
                    }
                });
                TaskStatusLog.belongsTo(models.Stage, {
                    foreignKey: {
                        allowNull: false
                    }
                });
                TaskStatusLog.belongsTo(models.User);
            }
        }
    });
    return TaskStatusLog;
};
