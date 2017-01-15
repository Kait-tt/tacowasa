'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
        'tasks',
        'body',
        {
          allowNull: false,
          type: Sequelize.TEXT
        }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
        'tasks',
        'body',
        {
          allowNull: false,
          type: Sequelize.TEXT
        }
    );
  }
};
