'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('githubRepositories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        allowNull: false,
        type: Sequelize.STRING
      },
      reponame: {
        allowNull: false,
        type: Sequelize.STRING
      },
      sync: {
        allowNull: false,
        defaultValue: true,
        type: Sequelize.BOOLEAN
      },
      hookId: {
        type: Sequelize.STRING
      },
      lastToken: {
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
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('githubRepositories');
  }
};