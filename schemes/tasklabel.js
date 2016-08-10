'use strict';
module.exports = function(sequelize, DataTypes) {
    var taskLabel = sequelize.define('taskLabel', {
        taskId: {
            allowNull: false,
            type: DataTypes.INTEGER
        },
        labelId: {
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
    return taskLabel;
};