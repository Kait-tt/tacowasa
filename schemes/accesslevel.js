'use strict';
module.exports = function(sequelize, DataTypes) {
    var accessLevel = sequelize.define('accessLevel', {
        projectId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        canReadReports: {
            allowNull: false,
            type: DataTypes.BOOLEAN
        },
        canWriteOwnTasks: {
            allowNull: false,
            type: DataTypes.BOOLEAN
        },
        canWriteTasks: {
            allowNull: false,
            type: DataTypes.BOOLEAN
        },
        canWriteLabels: {
            allowNull: false,
            type: DataTypes.BOOLEAN
        },
        canWriteProject: {
            allowNull: false,
            type: DataTypes.BOOLEAN
        },
    }, {
        classMethods: {
            associate: function(models) {
                // associations can be defined here
            }
        }
    });
    return accessLevel;
};
