'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('works', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      taskId: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      isEnded: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN
      },
      startTime: {
        allowNull: false,
        type: Sequelize.DATE
      },
      endTime: {
        allowNull: false,
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('works');
  }
};