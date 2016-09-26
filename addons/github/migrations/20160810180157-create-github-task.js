'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('githubTasks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      taskId: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      number: {
        allowNull: false,
        type: Sequelize.STRING
      },
      isPullRequest: {
        allowNull: false,
        defaultValue: false,
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
    },
    {
      engine: process.env.NODE_ENV === 'test' ? 'MYISAM' : 'InnoDB',
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('githubTasks');
  }
};
