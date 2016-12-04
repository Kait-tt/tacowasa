'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn(
        'tasks',
        'completedAt',
        {
          allowNull: true,
          type: Sequelize.DATE
        }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn(
        'tasks',
        'completedAt'
    );
  }
};
