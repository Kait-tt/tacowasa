'use strict';
module.exports = function(sequelize, DataTypes) {
  var task = sequelize.define('task', {
    projectId: {
      allowNull: false,
      type: DataTypes.STRING
    },
    stageId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    userId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    nextTaskId: {
      type: DataTypes.INTEGER
    },
    title: {
      allowNull: false,
      type: DataTypes.STRING
    },
    body: {
      allowNull: false,
      defaultValue: '',
      type: DataTypes.TEXT
    },
    cost: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    isWorking: {
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
  return task;
};