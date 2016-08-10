'use strict';
module.exports = function(sequelize, DataTypes) {
  var work = sequelize.define('work', {
    userId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    taskId: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    isEnded: {
      allowNull: false,
      defaultValue: false,
      type: DataTypes.BOOLEAN
    },
    startTime: {
      allowNull: false,
      type: DataTypes.DATE
    },
    endTime: {
      allowNull: false,
      type: DataTypes.DATE
    },
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return work;
};