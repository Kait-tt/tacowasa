'use strict';
module.exports = function (sequelize, DataTypes) {
    const TaskLabel = sequelize.define('taskLabel', {
    }, {
        classMethods: {
            associate: function (models) {
            }
        }
    });
    return TaskLabel;
};
