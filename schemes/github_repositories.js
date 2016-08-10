'use strict';
module.exports = function(sequelize, DataTypes) {
    var githubRepositories = sequelize.define('githubRepositories', {
        username: {
            allowNull: false,
            type: DataTypes.STRING
        },
        reponame: {
            allowNull: false,
            type: DataTypes.STRING
        },
        sync: {
            allowNull: false,
            defaultValue: true,
            type: DataTypes.BOOLEAN
        },
        hookId: {
            type: DataTypes.STRING
        },
        lastToken: {
            type: DataTypes.STRING
        },
    }, {
        classMethods: {
            associate: function(models) {
                // associations can be defined here
            }
        }
    });
    return githubRepositories;
};
