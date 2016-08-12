'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('accessLevels', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      projectId: {
        allowNull: false,
        type: Sequelize.STRING
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      canReadReports: {
        allowNull: false,
        type: Sequelize.BOOLEAN
      },
      canWriteOwnTasks: {
        allowNull: false,
        type: Sequelize.BOOLEAN
      },
      canWriteTasks: {
        allowNull: false,
        type: Sequelize.BOOLEAN
      },
      canWriteLabels: {
        allowNull: false,
        type: Sequelize.BOOLEAN
      },
      canWriteProject: {
        allowNull: false,
        type: Sequelize.BOOLEAN
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
    return queryInterface.dropTable('accessLevels');
  }
};