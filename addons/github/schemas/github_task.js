'use strict';
module.exports = function (sequelize, DataTypes) {
    const GitHubTask = sequelize.define('githubTask', {
        taskId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        number: {
            allowNull: false,
            type: DataTypes.STRING
        },
        isPullRequest: {
            allowNull: false,
            defaultValue: false,
            type: DataTypes.BOOLEAN
        }
    }, {
        classMethods: {
            associate: function (models) {
                GitHubTask.belongsTo(models.Task, {
                    foreignKey: {
                        allowNull: true
                    }
                });
                GitHubTask.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: true
                    }
                });
            }
        }
    });
    return GitHubTask;
};
