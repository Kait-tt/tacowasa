'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
        'githubRepositories',
        'projectId',
        {
          type: Sequelize.STRING,
          allowNull: false
        }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
        'githubRepositories',
        'projectId',
        {
          type: Sequelize.INTEGER,
          allowNull: false
        }
    );
  }
};
