'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
        'tasks',
        'userId',
        {
          allowNull: true,
          type: Sequelize.INTEGER
        }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
        'tasks',
        'userId',
        {
          allowNull: false,
          type: Sequelize.INTEGER
        }
    );
  }
};
