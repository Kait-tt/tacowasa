'use strict';
module.exports = function(sequelize, DataTypes) {
    var cost = sequelize.define('cost', {
        projectId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        number: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
    }, {
        classMethods: {
            associate: function(models) {
                // associations can be defined here
            }
        }
    });
    return cost;
};
