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
        cost: {
            allowNull: false,
            type: DataTypes.INTEGER
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
                        allowNull: true
                    }
                });
                Task.belongsTo(models.Stage, {
                    foreignKey: {
                        allowNull: true
                    }
                });
                Task.belongsTo(models.User, {
                    foreignKey: {
                        allowNull: true
                    }
                });
            }
        }
    });
    return Task;
};