'use strict';
module.exports = function(sequelize, DataTypes) {
    var TaskLabel = sequelize.define('taskLabel', {
    }, {
        classMethods: {
            associate: function(models) {
            }
        }
    });
    return TaskLabel;
};