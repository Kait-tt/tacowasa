'use strict';
module.exports = function(sequelize, DataTypes) {
    const Task = sequelize.define('task', {
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
    }, {
        classMethods: {
            associate: function(models) {
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
                        allowNull: false
                    }
                });
                Task.belongsTo(models.Cost, {
                    foreignKey: {
                        allowNull: false
                    }
                })
            }
        }
    });
    return Task;
};