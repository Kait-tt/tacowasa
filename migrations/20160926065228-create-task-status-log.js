'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('taskStatusLogs', {
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
      taskId: {
        allowNull: false,
        type: Sequelize.STRING
      },
      stageId: {
        allowNull: false,
        type: Sequelize.STRING
      },
      userId: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    },
        {
          engine: process.env.NODE_ENV === 'test' ? 'MYISAM' : 'InnoDB',
        });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('taskStatusLogs');
  }
};
