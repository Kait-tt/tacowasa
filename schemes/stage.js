'use strict';
module.exports = function(sequelize, DataTypes) {
    var stage = sequelize.define('stage', {
        projectId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        displayName: {
            allowNull: false,
            type: DataTypes.STRING
        },
        assigned: {
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
    return stage;
};