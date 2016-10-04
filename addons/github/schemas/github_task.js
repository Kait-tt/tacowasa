'use strict';
module.exports = function (sequelize, DataTypes) {
    const GitHubTask = sequelize.define('githubTask', {
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
                        allowNull: false
                    }
                });
                GitHubTask.belongsTo(models.Project, {
                    foreignKey: {
                        allowNull: false
                    }
                });
            }
        }
    });
    return GitHubTask;
};
