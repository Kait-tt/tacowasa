'use strict';
module.exports = function (sequelize, DataTypes) {
    const Task = sequelize.define('task', {
        prevTaskId: {
            type: DataTypes.INTEGER
        },
        nextTaskId: {
            type: DataTypes.INTEGER
        },
        title: {
            allowNull: false,
            type: DataTypes.STRING
        },
        body: {
            allowNull: false,
            defaultValue: '',
            type: DataTypes.TEXT
        },
        isWorking: {
            allowNull: false,
            defaultValue: false,
            type: DataTypes.BOOLEAN
        },
        completedAt: {
            allowNull: true,
            type: DataTypes.DATE
        }
    }, {
        classMethods: {
            associate: function (models) {
                Task.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: false
                    }
                });
                Task.belongsTo(models.Stage, {
                    foreignKey: {
                        allowNull: false
                    }
                });
                Task.belongsTo(models.User, {
                    foreignKey: {
                        allowNull: true,
                        defaultValue: null
                    }
                });
                Task.belongsTo(models.Cost, {
                    foreignKey: {
                        allowNull: false
                    }
                });
                Task.belongsToMany(models.Label, {
                    through: models.TaskLabel
                });
                Task.hasMany(models.Work);
                Task.hasMany(models.TaskStatusLog);
            }
        }
    });
    return Task;
};
