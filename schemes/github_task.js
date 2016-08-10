'use strict';
module.exports = function(sequelize, DataTypes) {
    var githubTask = sequelize.define('githubTask', {
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
        },
    }, {
        classMethods: {
            associate: function(models) {
                // associations can be defined here
            }
        }
    });
    return githubTask;
};
